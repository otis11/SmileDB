import { WebviewApp, WebviewAppMessage, getApp, renderWebviewApp } from ".."
import { MySQLPoolConnection } from "../../../mysql/MySQLPoolConnection"
import { getIconDarkLightPaths, getPoolConnection, getPoolConnectionConfigsAll, logError } from "../../common"
import { PoolConnectionConfig } from "../../types"

export function renderSearchApp() {
    const id = `search`
    let app = getApp(id)
    if (app) {
        // close old edit connection panel
        app.panel?.dispose()
    }

    app = {
        id,
        title: "Search",
        webviewPath: ['search'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths('help.svg'),
        htmlBody: getHtmlBody(),
    }

    renderWebviewApp(app)
}

async function onWebviewMessage(app: WebviewApp, message: WebviewAppMessage) {
    const { command, payload } = message

    if (command === "load.connections") {
        const connections = getPoolConnectionConfigsAll()
        app.panel?.webview.postMessage({ command: `load.connections.result`, payload: connections })
    } else if (command === "load.data") {
        const configs = payload.connectionConfigs as PoolConnectionConfig[]
        const data = []
        for (let i = 0; i < configs.length; i++) {
            const config = configs[i]
            const connection = getPoolConnection(config)
            if (!(connection instanceof MySQLPoolConnection)) {
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
                }) as MySQLPoolConnection
                try {
                    const tables = await dbConn.fetchTables()
                    data.push(...tables.map(table => ({
                        type: 'table',
                        database,
                        name: table,
                        connection: connection.config.name
                    })))
                } catch (e) { logError(e) }

                try {
                    const views = await dbConn.fetchViews()
                    data.push(...views.map(table => ({
                        type: 'view',
                        database,
                        name: table,
                        connection: connection.config.name
                    })))
                } catch (e) { logError(e) }

                try {
                    const procedures = await dbConn.fetchProcedures()
                    data.push(...procedures.map(table => ({
                        type: 'procedure',
                        database,
                        name: table,
                        connection: connection.config.name
                    })))
                } catch (e) { logError(e) }

                try {
                    const functions = await dbConn.fetchFunctions()
                    data.push(...functions.map(table => ({
                        type: 'function',
                        database,
                        name: table,
                        connection: connection.config.name
                    })))
                } catch (e) { logError(e) }
            }
        }
        app.panel?.webview.postMessage({ command: `load.data.result`, payload: data })
    }
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
        <vscode-data-grid id="results"></vscode-data-grid>
    </div>
    `
}
