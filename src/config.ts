import { workspace } from 'vscode'
import { LogLevel } from './modules/core'

export function getConfig() {
    const vsconfig = workspace.getConfiguration('SmileDB')
    return {
        tree: {
            expandTablesInstantly: vsconfig.get('tree.expandTablesInstantly') as boolean
        },
        general: {
            logLevel: LogLevel.debug,
            messageDisplay: vsconfig.get('general.messageDisplay') as 'Information Message' | 'Status Bar',
        },
        editConnection: {
            retainContextWhenHidden: vsconfig.get('editConnection.retainContextWhenHidden') as boolean,
        },
        table: {
            retainContextWhenHidden: vsconfig.get('table.retainContextWhenHidden') as boolean,
            pageResultsLimit: vsconfig.get('table.pageResultsLimit') as number | string,
            defaultEditMode: vsconfig.get('table.defaultEditMode') as 'Edit' | 'Select',
            pageResultsLimitOptions: vsconfig.get('table.pageResultsLimitOptions') as number[],
        },
        connections: {
            defaults: {
                stayAliveInSeconds: vsconfig.get('defaults.stayAliveInSeconds') as number,
                saveAuthentication: vsconfig.get('defaults.saveAuthentication') as boolean,
                trustServerCertificate: vsconfig.get('defaults.trustServerCertificate') as boolean,
                mysql: {
                    host: "localhost",
                    port: 3306,
                    database: "mysql",
                    global: false,
                    readonly: false,
                    password: "",
                    user: "",
                },
                mssql: {
                    host: "localhost",
                    port: 1433,
                    database: "",
                    global: false,
                    readonly: false,
                    password: "",
                    user: "",
                },
                postgresql: {
                    host: "localhost",
                    port: 5432,
                    database: "postgres",
                    global: false,
                    readonly: false,
                    password: "",
                    user: "",
                },
                mongodb: {
                    host: "localhost",
                    port: 27017,
                    database: "mongodb",
                    global: false,
                    readonly: false,
                    password: "",
                    user: "",
                },
                redis: {
                    host: "localhost",
                    port: 6379,
                    database: "0",
                    global: false,
                    readonly: false,
                    password: "",
                    user: "",
                },
                mariadb: {
                    host: "localhost",
                    port: 3306,
                    database: "mysql",
                    global: false,
                    readonly: false,
                    password: "",
                    user: "",
                },
            }
        }
    }
}
