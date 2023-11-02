import { workspace } from 'vscode';
import { LogLevel } from './modules/core';

const vsconfig = workspace.getConfiguration('SmileDB');

export const config = {
    general: {
        logLevel: LogLevel.debug,
        messageDisplay: vsconfig.get('general.messageDisplay') as 'Information Message' | 'Status Bar',
    },
    table: {
        pageResultsLimit: vsconfig.get('table.pageResultsLimit') as number | string,
        defaultEditMode: vsconfig.get('table.defaultEditMode') as 'Edit' | 'Select',
        pageResultsLimitOptions: vsconfig.get('table.pageResultsLimitOptions') as number[],
    },
    connections: {
        defaults: {
            stayAliveInSeconds: 60,
            saveAuthentication: false,
            trustServerCertificate: false,
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
};
