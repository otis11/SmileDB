import { getConfig } from "../../config"
import { ConnectionClientModule, PoolConnection, PoolConnectionConfig } from "../core"
import { MSSQLPoolConnection } from "./MSSQLPoolConnection"
import { getDatabaseTreeChildren } from "./getDatabaseTreeChildren"

export const mssqlModule: ConnectionClientModule = {
    name: 'MSSQL',
    icon: 'mssql.svg',
    iconActive: 'mssql-active.svg',
    createPoolConnection(config: PoolConnectionConfig): PoolConnection {
        return new MSSQLPoolConnection(config)
    },
    getDatabaseTreeChildren,
    getDefaultPoolConnectionConfig() {
        const config = getConfig()
        return {
            name: "",
            moduleName: 'MSSQL',
            id: -1,
            connection: {
                allowedMethods: ['hostPortDatabase'],
                host: config.connections.defaults.mssql.host,
                port: config.connections.defaults.mssql.port,
                database: config.connections.defaults.mssql.database,
            },
            authentication: {
                allowedMethods: ['usernamePassword'],
                password: config.connections.defaults.mssql.password,
                username: config.connections.defaults.mssql.user,
                saveAuthentication: config.connections.defaults.saveAuthentication
            },
            advanced: {
                global: config.connections.defaults.mssql.global,
                readonly: config.connections.defaults.mssql.readonly,
                stayAliveInSeconds: config.connections.defaults.stayAliveInSeconds,
                trustServerCertificate: config.connections.defaults.trustServerCertificate,
                allowedOrderByMethods: ['database', 'client'],
                activeOrderByMethod: 'database',
                filter: {
                    allowedMethods: ['database', 'client', 'query'],
                    activeMethod: 'database',
                    clientPrefilled: '',
                    clientPlaceholder: 'Search',
                    databasePrefilled: '',
                    databasePlaceholder: 'WHERE',
                    queryPrefilled: '',
                    queryPlaceholder: 'Query',
                }
            },
        }
    }
}
