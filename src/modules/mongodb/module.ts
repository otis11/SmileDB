import { getExtensionConfig } from "../../shared/extension-config"
import { ConnectionClientModule, PoolConnectionConfig } from "../../shared/types"
import { MongoDBPoolConnection } from "./MongoDBPoolConnection"
import { getDatabaseTreeChildren } from "./getDatabaseTreeChildren"

export const mongodbModule: ConnectionClientModule = {
    name: 'MongoDB',
    icon: 'mongodb.svg',
    iconActive: 'mongodb-active.svg',
    createPoolConnection(config: PoolConnectionConfig) {
        return new MongoDBPoolConnection(config)
    },
    getDatabaseTreeChildren,
    getDefaultPoolConnectionConfig() {
        const config = getExtensionConfig()
        return {
            name: "",
            moduleName: 'MongoDB',
            id: -1,
            connection: {
                allowedMethods: ['hostPortDatabase'],
                host: config.connections.defaults.mongodb.host,
                port: config.connections.defaults.mongodb.port,
                database: config.connections.defaults.mongodb.database,
            },
            authentication: {
                allowedMethods: ['usernamePassword'],
                password: config.connections.defaults.mongodb.password,
                username: config.connections.defaults.mongodb.user,
                saveAuthentication: config.connections.defaults.saveAuthentication
            },
            advanced: {
                stayAliveInSeconds: config.connections.defaults.stayAliveInSeconds,
                global: config.connections.defaults.mongodb.global,
                readonly: config.connections.defaults.mongodb.readonly,
                trustServerCertificate: config.connections.defaults.trustServerCertificate,
                allowedOrderByMethods: ['database', 'client'],
                activeOrderByMethod: 'database',
                filter: {
                    allowedMethods: ['database', 'client', 'query'],
                    activeMethod: 'database',
                    clientPrefilled: '',
                    clientPlaceholder: 'Search',
                    databasePrefilled: '{}',
                    databasePlaceholder: 'filter',
                    queryPrefilled: '',
                    queryPlaceholder: 'Query',
                }
            }
        }
    }
}
