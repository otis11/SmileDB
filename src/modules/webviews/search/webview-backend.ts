import { getIconDarkLightPaths } from '../../../shared/helper'
import {openWebviewConfig} from '../webview'
import {PoolConnectionConfig, SQLPoolConnection, WebviewConfig, WebviewMessage} from '../../../shared/types'
import { logError } from '../../../shared/logger'
import {openTableWebview} from '../table/webview-backend'
import { getPoolConnection } from '../../../shared/database-connections'
import {MongoDBPoolConnection} from '../../mongodb/MongoDBPoolConnection'
import {RedisPoolConnection} from '../../redis/RedisPoolConnection'
import {getPoolConnectionConfigsAll} from '../../../shared/connection-config'

export function openSearchWebview() {
    openWebviewConfig({
        id: 'search',
        title: "Search",
        webviewPath: ['search'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths('help.svg'),
        htmlBody: getHtmlBody(),
        retainContextWhenHidden: true,
    })
}

async function onWebviewMessage(webviewConfig: WebviewConfig, message: WebviewMessage) {
    const { command, payload } = message

    if (command === "load.connections") {
        const connections = getPoolConnectionConfigsAll()
        webviewConfig.panel?.webview.postMessage({ command: `load.connections.result`, payload: connections })
    } else if (command === "load.data") {
        const configs = payload.connectionConfigs as PoolConnectionConfig[]
        const data: any[] = []
        for (let i = 0; i < configs.length; i++) {
            const config = configs[i]
            const connection = getPoolConnection(config)
            if (connection instanceof MongoDBPoolConnection || connection instanceof RedisPoolConnection) {
                // todo others
                return
            }
            const databases = await connection.fetchDatabases()
            for (let j = 0; j < databases.length; j++) {
                const database = databases[j]
                const dbConn = getPoolConnection({
                    ...config,
                    connection: {
                        ...config.connection,
                        database,
                    }
                })

                if ('fetchSchemas' in dbConn) {
                    try {
                        const schemas = await dbConn.fetchSchemas()
                        for (let k = 0; k < schemas.length; k++) {
                            const dbConnSchema = getPoolConnection({
                                ...config,
                                connection: {
                                    ...config.connection,
                                    database,
                                    schema: schemas[k]
                                }
                            })
                            await addToData(data, dbConnSchema)
                        }
                    } catch (e) {
                        logError(e)
                    }
                } else {
                    await addToData(data, dbConn)
                }

            }
        }
        webviewConfig.panel?.webview.postMessage({ command: `load.data.result`, payload: data })
    } else if (command === "open") {
        const connectionConfig = getPoolConnectionConfigsAll().find(p => p.name === payload.connection)
        if (!connectionConfig) {
            return
        }

        connectionConfig.connection.database = payload.database
        if (payload.type === 'table') {
            openTableWebview(connectionConfig, payload.name)
        }
    }
}

async function addToData(data: any[], dbConn: SQLPoolConnection) {
    try {
        const tables = await dbConn.fetchTables()
        data.push(...tables.map(table => ({
            type: 'table',
            database: dbConn.config.connection.database,
            schema: dbConn.config.connection.schema,
            name: table,
            connection: dbConn.config.name
        })))
    } catch (e) { logError(e) }

    try {
        const views = await dbConn.fetchViews()
        data.push(...views.map(table => ({
            type: 'view',
            database: dbConn.config.connection.database,
            schema: dbConn.config.connection.schema,
            name: table,
            connection: dbConn.config.name
        })))
    } catch (e) { logError(e) }

    try {
        if ('fetchProcedures' in dbConn) {
            const procedures = await dbConn.fetchProcedures()
            data.push(...procedures.map(table => ({
                type: 'procedure',
                database: dbConn.config.connection.database,
                schema: dbConn.config.connection.schema,
                name: table,
                connection: dbConn.config.name
            })))
        }
    } catch (e) { logError(e) }

    try {
        if ('fetchFunctions' in dbConn) {
            const functions = await dbConn.fetchFunctions()
            data.push(...functions.map(table => ({
                type: 'function',
                database: dbConn.config.connection.database,
                schema: dbConn.config.connection.schema,
                name: table,
                connection: dbConn.config.name
            })))
        }
    } catch (e) { logError(e) }
}

function getHtmlBody(): string {
    return /*html*/`
    <div class="table-of-contents">
        <vscode-divider></vscode-divider>
        <h2>Available Connections</h2>
        <div id="connections"></div>
        <vscode-divider></vscode-divider>
        <vscode-text-field id="search" placeholder="Search..."></vscode-text-field>
        <div id="loading" class="d-none">
            <vscode-progress-ring></vscode-progress-ring>
        </div>
        <div class="stats">
            <div id="stats-tables"></div>
        </div>
        <vscode-data-grid id="results"></vscode-data-grid>
    </div>
    `
}