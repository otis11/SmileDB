import { ConnectionPool } from 'mssql'
import { DatabaseObjectDelete, DatabaseObjectInsert, DatabaseObjectUpdate, OrderByConfig, PoolConnection, PoolConnectionConfig, QueryConfigDelete, QueryConfigFetch, QueryConfigInsert, QueryConfigUpdate, QueryResult, QueryResultField, QueryResultFieldFlag, QueryResultRow, Timer } from "../core"

export type MSSQLColumn = {
    name: string,
    nullable: boolean,
    readOnly: boolean,
    caseSensitive: boolean,
    identity: boolean,
    index: number,
    length: number,
    type: {
        declaration: string,
    }
}

export type MSSQLQueryResult = {
    recordset: {
        columns: {
            [key: string]: MSSQLColumn
        }
    }
    recordsets: QueryResultRow[]
}

export class MSSQLPoolConnection implements PoolConnection {
    private pool: ConnectionPool
    private isConnected = false

    constructor(public config: PoolConnectionConfig) {
        const connectionConfig = {
            host: this.config.connection.host,
            port: this.config.connection.port,
            password: this.config.authentication.password,
            user: this.config.authentication.username,
            database: this.config.connection.database,
            server: this.config.connection.host || '',
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            },
            options: {
                encrypt: true, // for azure
                trustServerCertificate: config.advanced.trustServerCertificate // change to true for local dev / self-signed certs
            }
        }
        this.pool = new ConnectionPool(connectionConfig)
    }

    async closeConnection() {
        await this.pool.close()
    }

    async testConnection() {
        const timer = new Timer()
        const resultVersion = await this.query('SELECT @@VERSION')
        return {
            rows: [{
                version: resultVersion.recordset[0][''],
            }],
            fields: [],
            stats: {
                timeInMilliseconds: timer.stop(),
            }
        }
    }

    async fetchDatabases() {
        const timer = new Timer()
        const queryResult = await this.query('SELECT name FROM sys.databases')
        return {
            rows: this.getQueryResultRows(queryResult),
            fields: this.createQueryResultFields(queryResult as any),
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    private createQueryResultField(mssqlColumn: MSSQLColumn): QueryResultField {
        return {
            name: mssqlColumn.name,
            type: mssqlColumn.type?.declaration,
            flags: this.getQueryResultFieldFlags(mssqlColumn)
        }
    }

    private createQueryResultFields(queryResult: MSSQLQueryResult): QueryResultField[] {
        return Object.keys(queryResult.recordset.columns).map(column => this.createQueryResultField(queryResult.recordset.columns[column]))
    }

    async fetchTables() {
        const timer = new Timer()
        const queryResult = await this.query(`SELECT *
                                            FROM ${this.config.connection.database}.information_schema.tables
                                            WHERE TABLE_SCHEMA = '${this.config.connection.schema}'
                                            AND TABLE_TYPE NOT LIKE 'VIEW'`)
        return {
            rows: this.getQueryResultRows(queryResult),
            fields: [this.createQueryResultField(queryResult.recordset.columns.TABLE_NAME as any)],
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    async fetchDatabaseStats() {
        const timer = new Timer()
        const queryResult = await this.query(`SELECT
                                            (select count(*) from ${this.config.connection.database}.information_schema.tables WHERE TABLE_SCHEMA = '${this.config.connection.schema}' AND TABLE_TYPE NOT LIKE 'VIEW') as TotalTables,
                                            (select count(*) from ${this.config.connection.database}.information_schema.views WHERE TABLE_SCHEMA = '${this.config.connection.schema}') as TotalViews
                                           `)
        return {
            rows: this.getQueryResultRows(queryResult),
            fields: [],
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    async fetchViews() {
        const timer = new Timer()
        const queryResult = await this.query(`SELECT *
                                            FROM ${this.config.connection.database}.information_schema.views
                                            WHERE TABLE_SCHEMA = '${this.config.connection.schema}'
                                            `)
        return {
            rows: this.getQueryResultRows(queryResult),
            fields: [this.createQueryResultField(queryResult.recordset.columns.TABLE_NAME as any)],
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    async fetchSchemas() {
        const timer = new Timer()
        const queryResult = await this.query(`SELECT *
                                            FROM ${this.config.connection.database}.information_schema.schemata`)
        return {
            rows: this.getQueryResultRows(queryResult),
            fields: [this.createQueryResultField(queryResult.recordset.columns.SCHEMA_NAME as any)],
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    private getQueryResultRows(queryResult: any): QueryResultRow[] {
        return queryResult.recordsets[0]
    }

    private createOrderBy(configOrderBy?: OrderByConfig) {
        let orderBy = ''
        if (!configOrderBy) {
            return 'ORDER BY 1'
        }
        orderBy += 'ORDER BY ' + configOrderBy.field
        orderBy += configOrderBy.direction === 'ascending' ? ' ASC' : ' DESC'
        return orderBy
    }

    buildQueriesFetch(config: QueryConfigFetch) {
        const orderBy = this.createOrderBy(config.orderBy)
        const where = config.filterString ? 'WHERE ' + config.filterString : ''

        const query = `SELECT * FROM [${config.database}].[${config.schema}].[${config.table}]
${where}
${orderBy}
OFFSET ${config.page * config.pageResultsLimit} ROWS FETCH NEXT ${config.pageResultsLimit} ROWS ONLY`
        return [query]
    }

    buildQueriesInsert(insertions: DatabaseObjectInsert, queryConfig: QueryConfigInsert) {
        const queries: string[] = []
        for (let i = 0; i < insertions.insertions.length; i++) {
            const insertion = insertions.insertions[i]
            const queryStart = `INSERT INTO [${queryConfig.database}].[${queryConfig.schema}].[${queryConfig.table}]`
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
            queries.push(`DELETE FROM [${queryConfig.database}].[${queryConfig.schema}].[${queryConfig.table}]
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
            queries.push(`UPDATE [${config.database}].[${config.schema}].[${config.table}]
${setStatements}
${whereStatements}`)
        }
        return queries
    }

    async executeQuery(query: string): Promise<QueryResult> {
        const timer = new Timer()
        const result = await this.query(query)
        return {
            fields: [{
                flags: [],
                name: 'rowsAffected',
                type: ''
            }],
            rows: [{
                rowsAffected: result.rowsAffected[0]
            }],
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
        return {
            // @ts-ignore
            fields: this.createQueryResultFields(result),
            // @ts-ignore
            rows: result.recordsets[0],
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
        from [${config.database}].[${config.schema}].[${config.table}]
        ${where}`
        const result = await this.query(query)
        if (!result) {
            return 0
        }
        // @ts-ignore
        return result.recordsets[0][0][''] || 0
    }

    private getQueryResultFieldFlags(mssqlColumn: MSSQLColumn): QueryResultFieldFlag[] {
        const flags: QueryResultFieldFlag[] = []
        if (mssqlColumn.identity) {
            flags.push('autoincrement')
        }
        // if ((field.flags & 4) !== 0) {
        //     flags.push('unique');
        // }
        // if ((field.flags & 2) !== 0) {
        //     flags.push('primary');
        // }
        if (!mssqlColumn.nullable) {
            flags.push('notnull')
        }
        return flags
    }

    private convertJavascriptValueToSQL(val: any) {
        if (val === null) {
            return 'NULL'
        }
        if (typeof val === 'number') {
            return val
        }
        return `'${val}'`
    }

    private async query(query: string) {
        if (!this.isConnected) {
            await this.pool.connect()
            this.isConnected = true
        }
        return await this.pool.query(query)
    }
}
