import { commands, window } from "vscode"
import { PoolConnectionConfig, WebviewConfig, WebviewMessage } from "../../../shared/types"
import {getEditConnectionWebviewHtmlBody} from './webview-html'
import { openWebviewConfig } from "../webview"
import { getIconDarkLightPaths } from "../../../shared/helper"
import { getConnectionClientModule } from "../../../shared/module"
import { getExtensionConfig } from "../../../shared/extension-config"
import { logError, logInfo } from "../../../shared/logger"
import { refreshPoolConnection } from "../../../shared/database-connections"
import { storePoolConnectionConfig } from "../../../shared/connection-config"

export function openEditConnectionWebview(config: PoolConnectionConfig) {
    openWebviewConfig({
        id: `connection.edit.${config.moduleName}.${config.id}`,
        title: config.id === -1 ? `New ${config.moduleName} Connection` : `Edit ${config.name}`,
        webviewPath: ['edit-connection'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths(getConnectionClientModule(config.moduleName).icon),
        htmlBody: getEditConnectionWebviewHtmlBody(config),
        connectionConfig: config,
        retainContextWhenHidden: getExtensionConfig().editConnection.retainContextWhenHidden
    })
}

async function onWebviewMessage(app: WebviewConfig, message: WebviewMessage) {
    const { command, payload } = message


    if (command === 'connection.execute.test') {
        try {
            const connection = getConnectionClientModule(payload.moduleName).createPoolConnection(payload)
            const { stats, rows } = await connection.testConnection()
            await connection.closeConnection()
            app.panel?.webview.postMessage({ command: `connection.execute.test.result`, payload: { stats, message: rows[0] ? rows[0].version : '' } })
        } catch (e: any) {
            const stats = {
                timeInMillisconds: 0,
            }
            logInfo('Failed to connect.', app, e)
            app.panel?.webview.postMessage({ command: `connection.execute.test.error`, payload: { stats, message: e.message || e.code } })
        }
    }
    else if (command === 'connection.execute.save') {
        try {
            const authenticationClone = JSON.parse(JSON.stringify(payload.authentication))
            if (!authenticationClone.saveAuthentication) {
                payload.authentication = {
                    activeMethod: payload.authentication.activeMethod,
                    allowedMethods: payload.authentication.allowedMethods,
                    saveAuthentication: false,
                    password: '',
                    username: ''
                }
                const id = storePoolConnectionConfig(payload)
                refreshPoolConnection({
                    id,
                    ...payload,
                    authentication: authenticationClone,
                })
            } else {
                const id = storePoolConnectionConfig(payload)
                refreshPoolConnection({
                    id,
                    ...payload,
                })
            }
            const m = payload.name
            commands.executeCommand('SmileDB.refreshTreeConnections')
            app.panel?.webview.postMessage({ command: `connection.execute.save.result`, payload: { message: m } })
        } catch (e: any) {
            logError('Failed to save connection for webview app', app, e)
            const m = e.message
            app.panel?.webview.postMessage({ command: `connection.execute.save.error`, payload: { message: m } })
        }

    }

    else if (command === "file.open") {
        const files = await window.showOpenDialog({
            title: 'Select a file',
            canSelectMany: false,
            canSelectFolders: false,
            canSelectFiles: true,
        })

        const file = files ? files[0] : null
        app.panel?.webview.postMessage({ command: `file.open.result`, payload: file })
    }

    else if (command === "load.connectionConfig") {
        app.panel?.webview.postMessage({ command: `load.connectionConfig`, payload: app.connectionConfig })
    }
}