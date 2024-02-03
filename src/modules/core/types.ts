import { TreeItem } from "vscode"
import { PoolConnectionTreeItem } from "./provider"

export interface PoolConnection {
    config: PoolConnectionConfig
    closeConnection(): Promise<void>
    testConnection(): Promise<QueryResult>

    // build queries
    buildQueriesFetch(queryConfig: QueryConfigFetch): Query[]
    buildQueriesInsert(insertions: DatabaseObjectInsert, queryConfig: QueryConfigInsert): Query[]
    buildQueriesUpdate(changes: DatabaseObjectUpdate[], queryConfig: QueryConfigUpdate): Query[]
    buildQueriesDelete(deletions: DatabaseObjectDelete[], queryConfig: QueryConfigDelete): Query[]

    // execute queries
    executeQuery(query: Query): Promise<QueryResult>
    executeQueriesAndFetch(queries: Query[], queryConfig: QueryConfigFetch): Promise<QueryResult>
}

export interface QueryResultRow {
    [key: string]: string | null | number
}[]

export interface QueryResult {
    rows: QueryResultRow[],
    fields: QueryResultField[]
    stats: QueryResultStats
}

export interface QueryResultStats {
    timeInMilliseconds: number,
    rowCount?: number
}

export interface QueryConfigBase {
    database?: string,
    table?: string,
    schema?: string,
}

export interface QueryConfigFetch extends QueryConfigBase {
    page: number,
    pageResultsLimit: number,
    orderBy?: OrderByConfig
    filterString?: string
}

export type QueryConfigInsert = QueryConfigBase

export type QueryConfigDelete = QueryConfigBase

export type QueryConfigUpdate = QueryConfigBase

export interface DatabaseObjectUpdate {
    update: QueryResultRow
    where: QueryResultRow
}

export interface DatabaseObjectInsert {
    insertions: QueryResultRow[]
    fields: QueryResultField[]
}

export interface DatabaseObjectDelete {
    where: QueryResultRow
}

export interface OrderByConfig {
    field: string,
    direction: 'ascending' | 'descending'
}

export type Query = string

export type QueryResultFieldFlag =
    'primary' |
    'unique' |
    'autoincrement' |
    'notnull'

export type QueryResultField = {
    name: string,
    flags: QueryResultFieldFlag[],
    type: string,
}

export type ModuleName = string

export type Module = {
    name: ModuleName
    install?: () => void
}

export type ConnectionClientModule = Module & {
    defaultPoolConnectionConfig: DefaultPoolConnectionConfig
    createPoolConnection(config: PoolConnectionConfig): PoolConnection
    getDatabaseTreeChildren(item: PoolConnectionTreeItem): Promise<TreeItem[]>
    icon: string,
    iconActive: string,
}

export interface PoolConnectionConfig {
    id: number,
    name: string,
    moduleName: ModuleName,
    connection: {
        allowedMethods: PoolConnectionConnectionMethod[],
        activeMethod?: PoolConnectionConnectionMethod,
        // hostPortDatabase Method
        host?: string,
        port?: number,
        database?: string,
        schema?: string,
        // file Method
        file?: string,
    }
    authentication: {
        allowedMethods: PoolConnectionAuthenticationMethod[]
        activeMethod?: PoolConnectionAuthenticationMethod,
        saveAuthentication: boolean
        // usernamePassword Method
        username?: string,
        password?: string,
    }
    advanced: {
        stayAliveInSeconds: number,
        global: boolean,
        readonly: boolean,
        allowedOrderByMethods: AllowedOrderByMethod[],
        activeOrderByMethod: AllowedOrderByMethod,
        filter: {
            allowedMethods: AllowedFilterMethod[],
            activeMethod: AllowedFilterMethod,
            clientPrefilled: string,
            clientPlaceholder: string,
            databasePrefilled?: string,
            databasePlaceholder?: string,
            queryPrefilled: string,
            queryPlaceholder: string,
        },
        trustServerCertificate?: boolean,
    }
}

export type AllowedFilterMethod =
    'client' |
    'database' |
    'query'

export type AllowedOrderByMethod =
    'client' |
    'database'

export type PoolConnectionAuthenticationMethod =
    'usernamePassword'

export type PoolConnectionConnectionMethod =
    'hostPortDatabase' |
    'file'

export interface DefaultPoolConnectionConfig extends PoolConnectionConfig {
    id: -1
}
