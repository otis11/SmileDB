import { Disposable, TreeItem, Uri, WebviewPanel } from "vscode"

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

export interface SQLDatabaseStats {
    tables: number,
    procedures: number,
    functions: number,
    views: number
}

export interface SQLPoolConnection extends PoolConnection {
    fetchDatabaseStats(): Promise<SQLDatabaseStats>
    fetchFunctions(): Promise<string[]>
    fetchProcedures(): Promise<string[]>
    fetchFunction(name: string): Promise<string>
    fetchProcedure(name: string): Promise<string>
    fetchTables(): Promise<string[]>
    fetchViews(): Promise<string[]>
    fetchDatabases(): Promise<string[]>
    fetchSchemas?(): Promise<string[]>
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
    getDefaultPoolConnectionConfig: () => DefaultPoolConnectionConfig
    createPoolConnection(config: PoolConnectionConfig): PoolConnection
    getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]>
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

export type SQLQueryBuildConfig = {
    dbId: string,
    stringWrap?: string
}

export interface WebviewConfig {
    id: string,
    title: string,
    webviewPath: string[],
    onWebviewMessage: (webviewConfig: WebviewConfig, message: WebviewMessage) => any,
    htmlBody?: string,
    iconPath?: {
        light: Uri;
        dark: Uri;
    },
    disposables?: Disposable[],
    panel?: WebviewPanel,
    connectionConfig?: PoolConnectionConfig
    table?: string,
    retainContextWhenHidden?: boolean
}

export type WebviewMessage = {
    command: string,
    payload: any,
}

export type ShortcutRegister = {
    keys: {
        [key: string]: boolean
    },
    callback: () => any
}

export enum LogLevel {
    debug = 0,
    info = 1,
    warn = 2,
    error = 3
}
