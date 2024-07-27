import { TreeItem } from "vscode"
import { MySQLPoolConnection } from "./MySQLPoolConnection"
import { getExtensionConfig } from "../../shared/extension-config"
import { getDatabaseTreeChildrenSQL } from "../treeview/get-database-tree-children"
import { ConnectionClientModule, PoolConnection, PoolConnectionConfig } from "../../shared/types"

export const mysqlModule: ConnectionClientModule = {
    name: 'MySQL',
    icon: 'mysql.svg',
    iconActive: 'mysql-active.svg',
    createPoolConnection(config: PoolConnectionConfig): PoolConnection {
        return new MySQLPoolConnection(config)
    },
    getDatabaseTreeChildren: (item: TreeItem) => {
        return getDatabaseTreeChildrenSQL(item)
    },
    getDefaultPoolConnectionConfig() {
        const config = getExtensionConfig()
        return {
            name: "",
            moduleName: 'MySQL',
            id: -1,
            connection: {
                allowedMethods: ['hostPortDatabase'],
                host: config.connections.defaults.mysql.host,
                port: config.connections.defaults.mysql.port,
                database: config.connections.defaults.mysql.database,
            },
            authentication: {
                allowedMethods: ['usernamePassword'],
                password: config.connections.defaults.mysql.password,
                username: config.connections.defaults.mysql.user,
                saveAuthentication: config.connections.defaults.saveAuthentication
            },
            advanced: {
                global: config.connections.defaults.mysql.global,
                readonly: config.connections.defaults.mysql.readonly,
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
