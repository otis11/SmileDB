import { FieldPacket, Pool, createPool } from "mysql2/promise"
import { DatabaseObjectDelete, DatabaseObjectInsert, DatabaseObjectUpdate, OrderByConfig, PoolConnectionConfig, QueryConfigDelete, QueryConfigFetch, QueryConfigInsert, QueryConfigUpdate, QueryResultField, QueryResultFieldFlag, QueryResultRow, SQLPoolConnection, Timer } from "../core"
import { mysqlTypeMap } from "./types"

export class MySQLPoolConnection implements SQLPoolConnection {
    private pool: Pool

    constructor(public config: PoolConnectionConfig) {
        this.pool = createPool({
            host: this.config.connection.host,
            port: this.config.connection.port,
            password: this.config.authentication.password,
            user: this.config.authentication.username,
            database: this.config.connection.database,
        })
    }

    async closeConnection() {
        await this.pool.end()
    }

    async testConnection() {
        const timer = new Timer()
        const resultVersion = await this.query('SELECT VERSION()')
        const resultDriver = await this.query(`SHOW VARIABLES LIKE 'version_comment'`)
        return {
            rows: [{
                //@ts-ignore
                version: resultDriver[0][0]['Value'] + ' ' + resultVersion[0][0]['VERSION()'],
            }],
            fields: [],
            stats: {
                timeInMilliseconds: timer.stop(),
            }
        }
    }

    async fetchDatabases() {
        return this.executeAndMakeResult('SHOW DATABASES')
    }

    private createQueryResultField(mysqlField: FieldPacket): QueryResultField {
        return {
            name: mysqlField.name,
            // @ts-ignore
            type: mysqlTypeMap[mysqlField.type],
            flags: this.getQueryResultFieldFlags(mysqlField)
        }
    }

    private createQueryResultFields(mysqlFields: FieldPacket[]) {
        return mysqlFields.map(field => this.createQueryResultField(field))
    }

    async fetchTables() {
        return this.executeAndMakeResult(`SELECT TABLE_NAME
                                            FROM information_schema.TABLES
                                            WHERE TABLE_SCHEMA = '${this.config.connection.database}'
                                            AND TABLE_TYPE NOT LIKE 'VIEW'`)
    }

    async fetchProcedures() {
        return this.executeAndMakeResult(`SELECT routine_name
                                            FROM information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.database}'
                                            AND routine_type = 'PROCEDURE'`)

    }

    private async executeAndMakeResult(query: string) {
        const timer = new Timer()
        const queryResult = await this.query(query)
        return {
            fields: [this.createQueryResultField(queryResult[1][0])],
            rows: queryResult[0] as QueryResultRow[],
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    async fetchFunctions() {
        return this.executeAndMakeResult(`SELECT routine_name
                                            FROM information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.database}'
                                            AND routine_type = 'FUNCTION'`)
    }

    async fetchDatabaseStats() {
        return this.executeAndMakeResult(`SELECT
                                            (select count(*) from information_schema.TABLES WHERE TABLE_SCHEMA = '${this.config.connection.database}' AND TABLE_TYPE NOT LIKE 'VIEW') as tables,
                                            (select count(*) from information_schema.TABLES WHERE TABLE_SCHEMA = '${this.config.connection.database}' AND TABLE_TYPE LIKE 'VIEW') as views,
                                            (select count(*) from information_schema.routines WHERE routine_schema = '${this.config.connection.database}' AND routine_type = 'PROCEDURE') as procedures,
                                            (select count(*) from information_schema.routines WHERE routine_schema = '${this.config.connection.database}' AND routine_type = 'FUNCTION') as functions
                                           `)
    }

    async fetchViews() {
        return this.executeAndMakeResult(`SELECT TABLE_NAME
                                            FROM information_schema.TABLES
                                            WHERE TABLE_SCHEMA = '${this.config.connection.database}'
                                            AND TABLE_TYPE LIKE 'VIEW'`)
    }

    private createOrderBy(configOrderBy?: OrderByConfig) {
        let orderBy = ''
        if (!configOrderBy) {
            return orderBy
        }
        orderBy += 'ORDER BY ' + configOrderBy.field
        orderBy += configOrderBy.direction === 'ascending' ? ' ASC' : ' DESC'
        return orderBy
    }

    buildQueriesFetch(config: QueryConfigFetch) {
        const limit = `LIMIT ${config.page * config.pageResultsLimit}, ${config.pageResultsLimit}`
        const orderBy = this.createOrderBy(config.orderBy)
        const where = config.filterString ? 'WHERE ' + config.filterString : ''
        const query = `SELECT *
FROM ${config.database}.${config.table}
${where}
${orderBy}
${limit}`
        return [query]
    }

    buildQueriesInsert(insertions: DatabaseObjectInsert, queryConfig: QueryConfigInsert) {
        const queries: string[] = []
        for (let i = 0; i < insertions.insertions.length; i++) {
            const insertion = insertions.insertions[i]
            const queryStart = `INSERT INTO ${queryConfig.database}.${queryConfig.table}`
            const queryFields = ` (${Object.keys(insertion).join(', ')})`
            const queryValues = ` VALUES (${Object.keys(insertion).map(fieldName => this.convertJavascriptValueToSQL(insertion[fieldName]))})`
            queries.push(queryStart + queryFields + queryValues)
        }
        return queries
    }

    buildQueriesDelete(deletions: DatabaseObjectDelete[], queryConfig: QueryConfigDelete) {
        const queries = []
        for (let i = 0; i < deletions.length; i++) {
            const whereStatements = "WHERE " + Object.keys(deletions[i].where).map(field =>
                `${field} = ${this.convertJavascriptValueToSQL(deletions[i].where[field])}`
            ).join(' AND ')
            queries.push(`DELETE FROM ${queryConfig.database}.${queryConfig.table}
${whereStatements}`)
        }
        return queries
    }

    buildQueriesUpdate(changes: DatabaseObjectUpdate[], config: QueryConfigUpdate) {
        const queries = []
        for (let i = 0; i < changes.length; i++) {
            const whereStatements = "WHERE " + Object.keys(changes[i].where).map(field =>
                `${field} = ${this.convertJavascriptValueToSQL(changes[i].where[field])}`
            ).join(' AND ')
            const setStatements = "SET " + Object.keys(changes[i].update).map(field =>
                `${field} = ${this.convertJavascriptValueToSQL(changes[i].update[field])}`
            ).join(',')
            queries.push(`UPDATE ${config.database}.${config.table}
${setStatements}
${whereStatements}`)
        }
        return queries
    }

    async executeQuery(query: string) {
        const timer = new Timer()
        const result = await this.query(query)
        let fields = result[1]
        if (!fields) {
            fields = Object.keys(result[0]).map(key => ({
                name: key,
                type: 0xfe
            })) as []
        }

        let rows = result[0] as QueryResultRow[]
        if (!Array.isArray(result[0])) {
            // @ts-ignore
            rows = [rows]
        }
        return {
            fields: this.createQueryResultFields(fields),
            rows,
            stats: {
                timeInMilliseconds: timer.stop()
            }
        }
    }

    async executeQueriesAndFetch(queries: string[], config: QueryConfigFetch) {
        const timer = new Timer()
        const promises = []
        for (let i = 0; i < queries.length; i++) {
            promises.push(this.query(queries[i]))
        }
        await Promise.all(promises)
        const fetchQueries = this.buildQueriesFetch(config)
        const result = await this.query(fetchQueries[0])

        let fields = result[1]
        if (!fields) {
            fields = Object.keys(result[0]).map(key => ({
                name: key,
                type: 0xfe
            })) as []
        }

        let rows = result[0] as QueryResultRow[]
        if (!Array.isArray(result[0])) {
            // @ts-ignore
            rows = [rows]
        }
        return {
            fields: this.createQueryResultFields(fields),
            rows,
            stats: {
                rowCount: await this.fetchTotalRows(config),
                timeInMilliseconds: timer.stop()
            }
        }
    }

    private async fetchTotalRows(config: QueryConfigFetch): Promise<number> {
        const where = config.filterString ? 'WHERE ' + config.filterString : ''
        const query = `
        select count(*)
        from ${config.database}.${config.table}
        ${where}`
        const result = await this.query(query)
        if (!result) {
            return 0
        }
        // @ts-ignore
        return result[0][0]['count(*)'] || 0
    }

    private getQueryResultFieldFlags(field: FieldPacket): QueryResultFieldFlag[] {
        // https://github.com/sidorares/node-mysql2/blob/master/lib/constants/field_flags.js
        const flags: QueryResultFieldFlag[] = []
        if ((field.flags & 512) !== 0) {
            flags.push('autoincrement')
        }
        if ((field.flags & 4) !== 0) {
            flags.push('unique')
        }
        if ((field.flags & 2) !== 0) {
            flags.push('primary')
        }
        if ((field.flags & 1) !== 0) {
            flags.push('notnull')
        }
        return flags
    }

    private convertJavascriptValueToSQL(val: string | null | undefined | number) {
        if (val === null) {
            return 'NULL'
        }
        if (typeof val === 'number') {
            return val
        }
        return `"${val}"`
    }

    private async query(query: string) {
        return await this.pool.execute({ sql: query })
    }
}