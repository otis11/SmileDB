import { ExtensionContext } from "vscode";
import { PostgreSQLPoolConnection } from "./PostgreSQLPoolConnection";
import { ConnectionClientModule, PoolConnectionConfig } from "../core";
import { config } from "../../config";
import { getDatabaseTreeChildren } from "./getDatabaseTreeChildren";

export const postgresModule: ConnectionClientModule = {
    name: 'PostgreSQL',
    icon: 'postgresql.svg',
    iconActive: 'postgresql-active.svg',
    install(context: ExtensionContext) { },
    createPoolConnection(config: PoolConnectionConfig) {
        return new PostgreSQLPoolConnection(config);
    },
    getDatabaseTreeChildren,
    defaultPoolConnectionConfig: {
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
    },
};
