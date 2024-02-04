import { getConfig } from "../../config"
import { ConnectionClientModule, PoolConnection, PoolConnectionConfig } from "../core"
import { RedisPoolConnection } from "./RedisPoolConnection"
import { getDatabaseTreeChildren } from "./getDatabaseTreeChildren"

export const redisModule: ConnectionClientModule = {
    name: 'Redis',
    icon: 'redis.svg',
    iconActive: 'redis-active.svg',
    createPoolConnection(config: PoolConnectionConfig): PoolConnection {
        return new RedisPoolConnection(config)
    },
    getDatabaseTreeChildren,
    getDefaultPoolConnectionConfig() {
        const config = getConfig()
        return {
            name: "",
            moduleName: 'Redis',
            id: -1,
            connection: {
                allowedMethods: ['hostPortDatabase'],
                host: config.connections.defaults.redis.host,
                port: config.connections.defaults.redis.port,
                database: config.connections.defaults.redis.database,
            },
            authentication: {
                allowedMethods: ['usernamePassword'],
                password: config.connections.defaults.redis.password,
                username: config.connections.defaults.redis.user,
                saveAuthentication: config.connections.defaults.saveAuthentication
            },
            advanced: {
                global: config.connections.defaults.redis.global,
                readonly: config.connections.defaults.redis.readonly,
                stayAliveInSeconds: config.connections.defaults.stayAliveInSeconds,
                trustServerCertificate: config.connections.defaults.trustServerCertificate,
                allowedOrderByMethods: ['client'],
                activeOrderByMethod: 'client',
                filter: {
                    allowedMethods: ['client', 'query'],
                    activeMethod: 'client',
                    clientPrefilled: '',
                    clientPlaceholder: 'Search',
                    queryPrefilled: '',
                    queryPlaceholder: 'Query',
                }
            },
        }
    }
}

