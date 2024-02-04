import { getConfig } from "../../config"
import { ConnectionClientModule, PoolConnection, PoolConnectionConfig } from "../core"
import { MySQLPoolConnection } from "../mysql/MySQLPoolConnection"
import { getDatabaseTreeChildren } from "./getDatabaseTreeChildren"

export const mariadbModule: ConnectionClientModule = {
    name: 'MariaDB',
    icon: 'mariadb.svg',
    iconActive: 'mariadb-active.svg',
    createPoolConnection(config: PoolConnectionConfig): PoolConnection {
        return new MySQLPoolConnection(config)
    },
    getDatabaseTreeChildren,
    getDefaultPoolConnectionConfig() {
        const config = getConfig()
        return {
            name: "",
            moduleName: 'MariaDB',
            id: -1,
            connection: {
                allowedMethods: ['hostPortDatabase'],
                host: config.connections.defaults.mariadb.host,
                port: config.connections.defaults.mariadb.port,
                database: config.connections.defaults.mariadb.database,
            },
            authentication: {
                allowedMethods: ['usernamePassword'],
                password: config.connections.defaults.mariadb.password,
                username: config.connections.defaults.mariadb.user,
                saveAuthentication: config.connections.defaults.saveAuthentication
            },
            advanced: {
                global: config.connections.defaults.mariadb.global,
                readonly: config.connections.defaults.mariadb.readonly,
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
