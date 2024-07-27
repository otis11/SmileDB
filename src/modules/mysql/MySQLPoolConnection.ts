import { FieldPacket, Pool, createPool } from "mysql2/promise"
import { mysqlTypeMap } from "./types"
import { DatabaseObjectDelete, DatabaseObjectInsert, DatabaseObjectUpdate, OrderByConfig, PoolConnectionConfig, QueryConfigBase, QueryConfigDelete, QueryConfigFetch, QueryConfigInsert, QueryConfigUpdate, QueryResultField, QueryResultFieldFlag, QueryResultRow, SQLPoolConnection } from "../../shared/types"
import { Timer } from "../../shared/timer"
import { buildSQLQueryDeletions, buildSQLQueryInsertions, buildSQLQueryUpdates } from "../../shared/sql"

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
        return this.executeAndMakeResultFirstKey('SHOW DATABASES')
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

    async fetchProcedure(name: string) {
        const result = await this.query(`SELECT routine_definition, routine_comment
                                            FROM information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.database}'
                                            AND routine_type = 'PROCEDURE'
                                            AND routine_name = '${name}'`)
        // @ts-ignore
        return '/*' + result[0][0].ROUTINE_COMMENT + '*/\n\n\n' + result[0][0].ROUTINE_DEFINITION as string
    }

    async fetchFunction(name: string) {
        const result = await this.query(`SELECT routine_definition, routine_comment
                                            FROM information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.database}'
                                            AND routine_type = 'FUNCTION'
                                            AND routine_name = '${name}'`)
        // @ts-ignore
        return '/*' + result[0][0].ROUTINE_COMMENT + '*/\n\n\n' + result[0][0].ROUTINE_DEFINITION as string
    }

    async fetchTables() {
        return this.executeAndMakeResultFirstKey(`SELECT TABLE_NAME
                                            FROM information_schema.TABLES
                                            WHERE TABLE_SCHEMA = '${this.config.connection.database}'
                                            AND TABLE_TYPE NOT LIKE 'VIEW'`)
    }

    async fetchProcedures() {
        return this.executeAndMakeResultFirstKey(`SELECT routine_name
                                            FROM information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.database}'
                                            AND routine_type = 'PROCEDURE'`)
    }

    async fetchFunctions() {
        return this.executeAndMakeResultFirstKey(`SELECT routine_name
                                            FROM information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.database}'
                                            AND routine_type = 'FUNCTION'`)
    }

    private async executeAndMakeResultFirstKey(query: string): Promise<string[]> {
        const result = await this.query(query)
        // @ts-ignore
        return result[0].map(r => r[result[1][0].name])
    }

    async fetchDatabaseStats() {
        const result = await this.query(`SELECT
                                            (select count(*) from information_schema.TABLES WHERE TABLE_SCHEMA = '${this.config.connection.database}' AND TABLE_TYPE NOT LIKE 'VIEW') as tables,
                                            (select count(*) from information_schema.TABLES WHERE TABLE_SCHEMA = '${this.config.connection.database}' AND TABLE_TYPE LIKE 'VIEW') as views,
                                            (select count(*) from information_schema.routines WHERE routine_schema = '${this.config.connection.database}' AND routine_type = 'PROCEDURE') as procedures,
                                            (select count(*) from information_schema.routines WHERE routine_schema = '${this.config.connection.database}' AND routine_type = 'FUNCTION') as functions
                                           `)
        // @ts-ignore
        return result[0][0]
    }

    async fetchViews() {
        return this.executeAndMakeResultFirstKey(`SELECT TABLE_NAME
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
FROM ${this.dbId(config)}
${where}
${orderBy}
${limit}`
        return [query]
    }

    buildQueriesInsert(insertions: DatabaseObjectInsert, queryConfig: QueryConfigInsert) {
        return buildSQLQueryInsertions(
            insertions,
            {
                dbId: this.dbId(queryConfig),
                stringWrap: '"'
            }
        )
    }

    buildQueriesDelete(deletions: DatabaseObjectDelete[], queryConfig: QueryConfigDelete) {
        return buildSQLQueryDeletions(
            deletions,
            {
                dbId: this.dbId(queryConfig),
                stringWrap: '"'
            }
        )
    }

    buildQueriesUpdate(changes: DatabaseObjectUpdate[], queryConfig: QueryConfigUpdate) {
        return buildSQLQueryUpdates(
            changes,
            {
                dbId: this.dbId(queryConfig),
                stringWrap: '"'
            }
        )
    }

    private dbId(queryConfig: QueryConfigBase) {
        return `${queryConfig.database}.${queryConfig.table}`
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
        if(Array.isArray(field.flags)) {
            // TODO handle fields as string array
            return []
        }

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

    private async query(query: string) {
        return await this.pool.execute({ sql: query })
    }
}
