import { writeFileSync } from "fs"
import { commands, window, workspace } from "vscode"
import { PoolConnectionConfig, WebviewConfig, WebviewMessage } from "../../../shared/types"
import { copyToClipboard, getIconDarkLightPaths, showMessage } from '../../../shared/helper'
import { logWarn } from "../../../shared/logger"
import {getPoolConnection} from "../../../shared/database-connections"
import { getTableWebviewHtmlBody } from "./webview-html"
import { getExtensionConfig } from "../../../shared/extension-config"
import { openWebviewConfig } from "../webview"

export function openTableWebview(
    config: PoolConnectionConfig,
    table: string,
) {
    openWebviewConfig({
        id: `table.${config.moduleName}.${config.connection.schema}.${config.connection.database}.${table}`,
        title: `${table} - ${config.connection.database} - ${config.name}`,
        webviewPath: ['table'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths('table.svg'),
        htmlBody: getTableWebviewHtmlBody(config),
        connectionConfig: config,
        table,
        retainContextWhenHidden: getExtensionConfig().table.retainContextWhenHidden
    })
}

async function onWebviewMessage(webviewConfig: WebviewConfig, message: WebviewMessage) {
    if (!webviewConfig.connectionConfig) {
        logWarn('Invalid State: Table webviewConfig has no connection config and received a webview message', webviewConfig)
        return
    }

    const { command, payload } = message
    const queryConfig = {
        table: webviewConfig.table,
        database: webviewConfig.connectionConfig.connection.database,
        schema: webviewConfig.connectionConfig.connection.schema,
        page: payload?.page,
        pageResultsLimit: payload?.pageResultsLimit,
        filterString: payload?.filterString,
        orderBy: payload?.orderBy,
    }

    const connection = getPoolConnection(webviewConfig.connectionConfig)

    if (command === "query.execute.fetch") {
        try {
            const data = await connection.executeQueriesAndFetch([], queryConfig)
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.fetch.result`, payload: data })
        } catch (e: any) {
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.fetch.error`, payload: e.message })
        }
    }

    if (command === "query.execute.rawQuery") {
        try {
            const data = await connection.executeQuery(payload.rawQuery)
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.rawQuery.result`, payload: data })
        } catch (e: any) {
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.rawQuery.error`, payload: e.message })
        }
    }

    if (command === "query.execute.update") {
        try {
            const queries = connection.buildQueriesUpdate(payload.updates, queryConfig)
            const result = await connection.executeQueriesAndFetch(queries, queryConfig)
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.update.result`, payload: result })
            showMessage('Changes applied')
        } catch (e: any) {
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.update.error`, payload: e.message })
        }

    }

    if (command === "query.execute.delete") {
        try {
            const queries = connection.buildQueriesDelete(payload.deletes, queryConfig)
            const result = await connection.executeQueriesAndFetch(queries, queryConfig)
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.delete.result`, payload: result })
            showMessage('Deletions applied')
        } catch (e: any) {
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.delete.error`, payload: e.message })
        }
    }

    if (command === "query.execute.insert") {
        try {
            const queries = connection.buildQueriesInsert(payload.insertions, queryConfig)
            const result = await connection.executeQueriesAndFetch(queries, queryConfig)
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.insert.result`, payload: result })
            showMessage('Inserts applied')
        } catch (e: any) {
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.insert.error`, payload: e.message })
        }
    }

    if (command === "query.execute.preview") {
        try {
            const queriesInsert = connection.buildQueriesInsert(payload.insertions || { insertions: [], fields: [] }, queryConfig)
            const queriesFetch = connection.buildQueriesFetch(queryConfig)
            const queriesDelete = connection.buildQueriesDelete(payload.deletes || [], queryConfig)
            const queriesUpdate = connection.buildQueriesUpdate(payload.updates || [], queryConfig)
            webviewConfig.panel?.webview.postMessage({
                command: `query.execute.preview.result`, payload: {
                    queriesDelete,
                    queriesFetch,
                    queriesInsert,
                    queriesUpdate,
                }
            })
        } catch (e: any) {
            webviewConfig.panel?.webview.postMessage({ command: `query.execute.preview.error`, payload: e.message })
        }
    }

    if (command === "load.connectionConfig") {
        webviewConfig.panel?.webview.postMessage({ command: `load.connectionConfig`, payload: webviewConfig.connectionConfig })
    }

    if (command === "load.extensionConfig") {
        webviewConfig.panel?.webview.postMessage({ command: `load.extensionConfig`, payload: getExtensionConfig() })
    }

    if (command === "workbench.action.openSettings") {
        commands.executeCommand(command, payload)
    }

    if (command === "export.chooseLocation") {
        const files = await window.showOpenDialog({
            title: 'Select a file',
            canSelectMany: false,
            canSelectFolders: true,
            canSelectFiles: false,
        })

        const path = files ? files[0].path : null
        webviewConfig.panel?.webview.postMessage({ command: `export.chooseLocation.result`, payload: path })
    }

    if (command === "copy.toClipboard") {
        copyToClipboard(message.payload)
    }

    if (command === "export.save.toFile") {
        try {
            writeFileSync(message.payload.path, message.payload.data, 'utf-8')
            workspace.openTextDocument(message.payload.path).then(doc => {
                window.showTextDocument(doc)
            })
            webviewConfig.panel?.webview.postMessage({ command: `export.save.toFile.result` })
        } catch (e: any) {
            webviewConfig.panel?.webview.postMessage({ command: `export.save.toFile.error`, payload: e.message })
        }
    }

    if (command === "export.load.completeDatabase") {
        try {
            const data = await connection.executeQueriesAndFetch([], {
                ...queryConfig,
                page: 0,
                pageResultsLimit: Number.MAX_SAFE_INTEGER,
            })
            webviewConfig.panel?.webview.postMessage({ command: `export.load.completeDatabase.result`, payload: data })
        } catch (e: any) {
            webviewConfig.panel?.webview.postMessage({ command: `export.load.completeDatabase.error`, payload: e.message })
        }
    }
}
