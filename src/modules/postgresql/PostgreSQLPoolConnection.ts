import { FieldDef, Pool } from "pg"
import { DatabaseObjectDelete, DatabaseObjectInsert, DatabaseObjectUpdate, OrderByConfig, PoolConnection, PoolConnectionConfig, QueryConfigDelete, QueryConfigFetch, QueryConfigInsert, QueryConfigUpdate, QueryResultField, QueryResultFieldFlag, Timer } from "../core"
import { postgresqlTypeMap } from "./types"

export type FieldConstraintsHashMap = Record<string, {
    is_auto_increment: 'YES' | 'NO'
    is_nullable: 'YES' | 'NO'
    is_primary_key: 'YES' | 'NO'
    is_unique: 'YES' | 'NO'
}>

export class PostgreSQLPoolConnection implements PoolConnection {
    private pool: Pool

    constructor(public config: PoolConnectionConfig) {
        this.pool = new Pool({
            host: config.connection.host,
            port: config.connection.port,
            database: config.connection.database,
            user: config.authentication.username,
            password: config.authentication.password,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })
    }

    async closeConnection() {
        await this.pool.end()
    }

    async testConnection() {
        const timer = new Timer()
        const resultVersion = await this.query('SELECT VERSION()')
        return {
            fields: [],
            rows: [{
                version: resultVersion.rows[0]['version'],
            }],
            stats: {
                timeInMilliseconds: timer.stop(),
            }
        }
    }

    // todo fix, bad but a connection pool is only for a single connection. right now this bad fix but fix
    private getPool(database: string) {
        return new Pool({
            host: this.config.connection.host,
            port: this.config.connection.port,
            database: database,
            user: this.config.authentication.username,
            password: this.config.authentication.password,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })
    }


    async fetchSchemas() {
        const timer = new Timer()
        const query = `
        SELECT schema_name
        FROM information_schema.schemata
        WHERE catalog_name = '${this.config.connection.database}'`.trim()
        const queryResult = await this.pool.query(query)
        return {
            fields: this.createQueryResultFields(queryResult.fields, {}),
            rows: queryResult.rows,
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    async fetchDatabases() {
        const timer = new Timer()
        const queryResult = await this.query('SELECT datname FROM pg_database')
        return {
            fields: this.createQueryResultFields(queryResult.fields, {}),
            rows: queryResult.rows,
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    async fetchTables() {
        const timer = new Timer()
        const queryResult = await this.pool.query(`SELECT table_name
                                            FROM information_schema.tables
                                            WHERE table_schema = '${this.config.connection.schema}'
                                            AND table_catalog = '${this.config.connection.database}'
                                            ORDER BY table_name`)
        return {
            fields: this.createQueryResultFields(queryResult.fields, {}),
            rows: queryResult.rows,
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    async fetchViews() {
        const timer = new Timer()
        const queryResult = await this.pool.query(`SELECT table_name
                                            FROM information_schema.views
                                            WHERE table_schema = '${this.config.connection.schema}'
                                            AND table_catalog = '${this.config.connection.database}'
                                            ORDER BY table_name`)
        return {
            fields: this.createQueryResultFields(queryResult.fields, {}),
            rows: queryResult.rows,
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }
    async fetchDatabaseStats() {
        const timer = new Timer()
        const queryResult = await this.query(`SELECT
                                            (select count(*) from information_schema.tables WHERE TABLE_SCHEMA = '${this.config.connection.schema}' AND table_catalog = '${this.config.connection.database}') as totaltables,
                                            (select count(*) from information_schema.views WHERE TABLE_SCHEMA = '${this.config.connection.schema}' AND table_catalog = '${this.config.connection.database}') as totalviews
                                           `)
        return {
            fields: this.createQueryResultFields(queryResult.fields, {}),
            rows: queryResult.rows,
            stats: {
                timeInMilliseconds: timer.stop(),
            },
        }
    }

    private createQueryResultField(field: FieldDef, fieldConstraintsHashMap: FieldConstraintsHashMap): QueryResultField {
        const constraints: QueryResultFieldFlag[] = []
        if (fieldConstraintsHashMap[field.name]?.is_auto_increment === 'YES') {
            constraints.push('autoincrement')
        }
        if (fieldConstraintsHashMap[field.name]?.is_nullable === 'NO') {
            constraints.push('notnull')
        }
        if (fieldConstraintsHashMap[field.name]?.is_primary_key === 'YES') {
            constraints.push('primary')
        }
        if (fieldConstraintsHashMap[field.name]?.is_unique === 'YES') {
            constraints.push('unique')
        }
        return {
            name: field.name,
            //@ts-ignore
            type: postgresqlTypeMap[field.name],
            flags: constraints,
        }
    }

    private createQueryResultFields(fields: FieldDef[], fieldConstraintsHashMap: FieldConstraintsHashMap) {
        return fields.map(field => this.createQueryResultField(field, fieldConstraintsHashMap))
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
        const limit = `LIMIT ${config.pageResultsLimit} OFFSET ${config.page * config.pageResultsLimit}`
        const orderBy = this.createOrderBy(config.orderBy)
        const where = config.filterString ? 'WHERE ' + config.filterString : ''
        const query = `SELECT *
FROM "${config.database}"."${config.schema}"."${config.table}"
${where}
${orderBy}
${limit}`
        return [query]
    }

    buildQueriesInsert(insertions: DatabaseObjectInsert, queryConfig: QueryConfigInsert) {
        const queries: string[] = []
        for (let i = 0; i < insertions.insertions.length; i++) {
            const insertion = insertions.insertions[i]
            const queryStart = `INSERT INTO "${queryConfig.database}"."${queryConfig.schema}"."${queryConfig.table}"`
            const queryFields = ` (${Object.keys(insertion).join(', ')})`
            const queryValues = ` VALUES (${Object.keys(insertion).map(fieldName => this.convertJavascriptValueToPSQL(insertion[fieldName]))})`
            queries.push(queryStart + queryFields + queryValues)
        }
        return queries
    }

    buildQueriesDelete(deletions: DatabaseObjectDelete[], queryConfig: QueryConfigDelete) {
        const queries = []
        for (let i = 0; i < deletions.length; i++) {
            const whereStatements = "WHERE " + Object.keys(deletions[i].where).map(field =>
                `${field} = ${this.convertJavascriptValueToPSQL(deletions[i].where[field])}`
            ).join(' AND ')
            queries.push(`DELETE FROM "${queryConfig.database}"."${queryConfig.schema}"."${queryConfig.table}"
${whereStatements}`)
        }
        return queries
    }

    buildQueriesUpdate(changes: DatabaseObjectUpdate[], config: QueryConfigUpdate) {
        const queries = []
        for (let i = 0; i < changes.length; i++) {
            const whereStatements = "WHERE " + Object.keys(changes[i].where).map(field =>
                `${field} = ${this.convertJavascriptValueToPSQL(changes[i].where[field])}`
            ).join(' AND ')
            const setStatements = "SET " + Object.keys(changes[i].update).map(field =>
                `${field} = ${this.convertJavascriptValueToPSQL(changes[i].update[field])}`
            ).join(',')
            queries.push(`UPDATE "${config.database}"."${config.schema}"."${config.table}"
${setStatements}
${whereStatements}`)
        }
        return queries
    }


    convertJavascriptValueToPSQL(val: string | number | null | undefined) {
        if (val === null) {
            return 'NULL'
        }
        if (typeof val === 'number') {
            return val
        }
        return `'${val}'`
    }

    private async fetchFieldConstraints(config: QueryConfigFetch, pool: Pool) {
        const query = `
            SELECT
            column_name,
            is_nullable,
            CASE WHEN (SELECT COUNT(*)
                       FROM information_schema.table_constraints
                       WHERE constraint_type = 'UNIQUE'
                         AND table_name = '${config.table}'
                         AND constraint_name = (
                           SELECT constraint_name
                           FROM information_schema.constraint_column_usage
                           WHERE table_name = '${config.table}'
                             AND column_name = c.column_name
                         )) > 0 THEN 'YES' ELSE 'NO' END AS is_unique,
            CASE WHEN (SELECT COUNT(*)
                       FROM information_schema.table_constraints
                       WHERE constraint_type = 'PRIMARY KEY'
                         AND table_name = '${config.table}'
                         AND constraint_name = (
                           SELECT constraint_name
                           FROM information_schema.constraint_column_usage
                           WHERE table_name = '${config.table}'
                             AND column_name = c.column_name
                         )) > 0 THEN 'YES' ELSE 'NO' END AS is_primary_key,
            CASE WHEN (SELECT column_default LIKE 'nextval%'
                       FROM information_schema.columns
                       WHERE table_name = '${config.table}'
                         AND column_name = c.column_name) THEN 'YES' ELSE 'NO' END AS is_auto_increment
            FROM information_schema.columns c
            WHERE table_name = '${config.table}';
            `

        return await pool.query(query)
    }

    async executeQuery(query: string) {
        const timer = new Timer()
        const queryResult = await this.query(query)
        return {
            fields: this.createQueryResultFields(queryResult.fields, {}),
            rows: queryResult.rows,
            stats: {
                rowCount: queryResult.rowCount,
                timeInMilliseconds: timer.stop()
            }
        }
    }

    async executeQueriesAndFetch(queries: string[], config: QueryConfigFetch) {
        const timer = new Timer()
        const pool = this.getPool(config.database || this.config.connection.database || '')
        const promises = []
        for (let i = 0; i < queries.length; i++) {
            promises.push(pool.query(queries[i]))
        }
        await Promise.all(promises)
        const fetchQueries = this.buildQueriesFetch(config)
        const queryResult = await pool.query(fetchQueries[0])
        const queryResultFieldConstraints = await this.fetchFieldConstraints(config, pool)
        const rowCount = await this.fetchTotalRows(config, pool)
        await pool.end()
        const fieldConstraintsHashMap: FieldConstraintsHashMap = {}
        queryResultFieldConstraints.rows.forEach(row => {
            fieldConstraintsHashMap[row.column_name] = row
        })
        return {
            fields: this.createQueryResultFields(queryResult.fields, fieldConstraintsHashMap),
            rows: queryResult.rows,
            stats: {
                rowCount,
                timeInMilliseconds: timer.stop()
            }
        }
    }

    private async fetchTotalRows(config: QueryConfigFetch, pool: Pool): Promise<number> {
        const where = config.filterString ? 'WHERE ' + config.filterString : ''
        const query = `
        SELECT COUNT(*)
        FROM "${config.database}"."${config.schema}"."${config.table}"
        ${where}`
        const result = await pool.query(query)
        if (!result) {
            return 0
        }
        return parseInt(result.rows[0].count) || 0
    }

    private async query(query: string) {
        return await this.pool.query(query)
    }
}
