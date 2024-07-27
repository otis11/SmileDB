import { TreeItem } from "vscode"
import { PostgreSQLPoolConnection } from "./PostgreSQLPoolConnection"
import { getExtensionConfig } from "../../shared/extension-config"
import { ConnectionClientModule, PoolConnectionConfig } from "../../shared/types"
import {getDatabaseTreeChildrenSQL} from '../treeview/get-database-tree-children'

export const postgresModule: ConnectionClientModule = {
    name: 'PostgreSQL',
    icon: 'postgresql.svg',
    iconActive: 'postgresql-active.svg',
    createPoolConnection(config: PoolConnectionConfig) {
        return new PostgreSQLPoolConnection(config)
    },
    getDatabaseTreeChildren: (item: TreeItem) => {
        return getDatabaseTreeChildrenSQL(item, { schemas: true })
    },
    getDefaultPoolConnectionConfig() {
        const config = getExtensionConfig()
        return {
            name: "",
            moduleName: 'PostgreSQL',
            id: -1,
            connection: {
                allowedMethods: ['hostPortDatabase'],
                host: config.connections.defaults.postgresql.host,
                port: config.connections.defaults.postgresql.port,
                database: config.connections.defaults.postgresql.database,
            },
            authentication: {
                allowedMethods: ['usernamePassword'],
                password: config.connections.defaults.postgresql.password,
                username: config.connections.defaults.postgresql.user,
                saveAuthentication: config.connections.defaults.saveAuthentication
            },
            advanced: {
                global: config.connections.defaults.postgresql.global,
                readonly: config.connections.defaults.postgresql.readonly,
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
            }
        }
    }
}
