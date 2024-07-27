import { ConnectionPool } from 'mssql'
import { DatabaseObjectDelete, DatabaseObjectInsert, DatabaseObjectUpdate, OrderByConfig, PoolConnectionConfig, QueryConfigBase, QueryConfigDelete, QueryConfigFetch, QueryConfigInsert, QueryConfigUpdate, QueryResult, QueryResultField, QueryResultFieldFlag, QueryResultRow, SQLDatabaseStats, SQLPoolConnection } from "../../shared/types"
import { Timer } from '../../shared/timer'
import { buildSQLQueryDeletions, buildSQLQueryInsertions, buildSQLQueryUpdates } from '../../shared/sql'

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

export class MSSQLPoolConnection implements SQLPoolConnection {
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
        const queryResult = await this.query('SELECT name FROM sys.databases')
        return this.getQueryResultRows(queryResult).map(r => r.name) as string[]
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
        const queryResult = await this.query(`SELECT TABLE_NAME
                                            FROM ${this.config.connection.database}.information_schema.tables
                                            WHERE TABLE_SCHEMA = '${this.config.connection.schema}'
                                            AND TABLE_TYPE NOT LIKE 'VIEW'`)
        return this.getQueryResultRows(queryResult).map(r => r.TABLE_NAME) as string[]
    }

    async fetchProcedure(name: string) {
        const result = await this.query(`SELECT routine_definition
                                            FROM information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.schema}'
                                            AND routine_catalog = '${this.config.connection.database}'
                                            AND routine_type = 'PROCEDURE'
                                            AND routine_name = '${name}'`)
        const rows = this.getQueryResultRows(result)
        return rows[0].routine_definition as string
    }

    async fetchFunction(name: string) {
        const result = await this.query(`SELECT routine_definition
                                            FROM information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.schema}'
                                            AND routine_catalog = '${this.config.connection.database}'
                                            AND routine_type = 'FUNCTION'
                                            AND routine_name = '${name}'`)
        const rows = this.getQueryResultRows(result)
        return rows[0].routine_definition as string
    }

    async fetchDatabaseStats() {
        const queryResult = await this.query(`SELECT
                                            (select count(*) from ${this.config.connection.database}.information_schema.tables WHERE TABLE_SCHEMA = '${this.config.connection.schema}' AND TABLE_TYPE NOT LIKE 'VIEW') as tables,
                                            (select count(*) from ${this.config.connection.database}.information_schema.views WHERE TABLE_SCHEMA = '${this.config.connection.schema}') as views,
                                            (select count(*) from ${this.config.connection.database}.information_schema.routines WHERE routine_schema = '${this.config.connection.schema}' AND routine_type = 'PROCEDURE') as procedures,
                                            (select count(*) from ${this.config.connection.database}.information_schema.routines WHERE routine_schema = '${this.config.connection.schema}' AND routine_type = 'FUNCTION') as functions
                                           `)
        return this.getQueryResultRows(queryResult)[0] as unknown as SQLDatabaseStats
    }

    async fetchViews() {
        const queryResult = await this.query(`SELECT TABLE_NAME
                                            FROM ${this.config.connection.database}.information_schema.views
                                            WHERE TABLE_SCHEMA = '${this.config.connection.schema}'
                                            `)
        return this.getQueryResultRows(queryResult).map(r => r.TABLE_NAME) as string[]
    }

    async fetchProcedures() {
        const queryResult = await this.query(`SELECT ROUTINE_NAME
                                            FROM ${this.config.connection.database}.information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.schema}'
                                            AND routine_type = 'PROCEDURE'`)
        return this.getQueryResultRows(queryResult).map(r => r.ROUTINE_NAME) as string[]
    }

    async fetchFunctions() {
        const queryResult = await this.query(`SELECT ROUTINE_NAME
                                            FROM ${this.config.connection.database}.information_schema.routines
                                            WHERE routine_schema = '${this.config.connection.schema}'
                                            AND routine_type = 'FUNCTION'`)
        return this.getQueryResultRows(queryResult).map(r => r.ROUTINE_NAME) as string[]
    }

    async fetchSchemas() {
        const queryResult = await this.query(`SELECT SCHEMA_NAME
                                            FROM ${this.config.connection.database}.information_schema.schemata`)
        return this.getQueryResultRows(queryResult).map(r => r.SCHEMA_NAME) as string[]

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

        const query = `SELECT * FROM ${this.dbId(config)}
${where}
${orderBy}
OFFSET ${config.page * config.pageResultsLimit} ROWS FETCH NEXT ${config.pageResultsLimit} ROWS ONLY`
        return [query]
    }

    buildQueriesInsert(insertions: DatabaseObjectInsert, queryConfig: QueryConfigInsert) {
        return buildSQLQueryInsertions(
            insertions,
            {
                dbId: this.dbId(queryConfig),
            }
        )
    }

    buildQueriesDelete(deletions: DatabaseObjectDelete[], queryConfig: QueryConfigDelete) {
        return buildSQLQueryDeletions(
            deletions,
            {
                dbId: this.dbId(queryConfig),
            }
        )
    }

    buildQueriesUpdate(changes: DatabaseObjectUpdate[], queryConfig: QueryConfigUpdate) {
        return buildSQLQueryUpdates(
            changes,
            {
                dbId: this.dbId(queryConfig),
            }
        )
    }

    private dbId(queryConfig: QueryConfigBase) {
        return `[${queryConfig.database}].[${queryConfig.schema}].[${queryConfig.table}]`
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

    private async query(query: string) {
        if (!this.isConnected) {
            await this.pool.connect()
            this.isConnected = true
        }
        return await this.pool.query(query)
    }
}
