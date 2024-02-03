import { writeFileSync } from "fs"
import { Uri, commands, window, workspace } from "vscode"
import { WebviewApp, WebviewAppMessage, getApp, renderWebviewApp } from ".."
import { config } from "../../../../config"
import { copyToClipboard, getIconDarkLightPaths, getPoolConnection, logWarn, showMessage } from "../../common"
import { PoolConnectionConfig } from "../../types"

export function renderTableApp(
    extensionUri: Uri,
    config: PoolConnectionConfig,
    table: string,
) {
    const id = `table.${config.moduleName}.${config.connection.schema}.${config.connection.database}.${table}`
    let app = getApp(id)
    if (app) {
        app.panel?.reveal()
        return
    }

    app = {
        id,
        title: `${table} - ${config.connection.database} - ${config.name}`,
        webviewPath: ['table'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths(extensionUri, 'table.svg'),
        htmlBody: getHtmlBody(config),
        connectionConfig: config,
        table,
    }

    renderWebviewApp(extensionUri, app)
}

async function onWebviewMessage(app: WebviewApp, message: WebviewAppMessage) {
    if (!app.connectionConfig) {
        logWarn('Invalid State: Table App has no connection config and received a webview message', app)
        return
    }

    const { command, payload } = message
    const queryConfig = {
        table: app.table,
        database: app.connectionConfig.connection.database,
        schema: app.connectionConfig.connection.schema,
        page: payload?.page,
        pageResultsLimit: payload?.pageResultsLimit,
        filterString: payload?.filterString,
        orderBy: payload?.orderBy,
    }

    const connection = getPoolConnection(app.connectionConfig)

    if (command === "query.execute.fetch") {
        try {
            const data = await connection.executeQueriesAndFetch([], queryConfig)
            app.panel?.webview.postMessage({ command: `query.execute.fetch.result`, payload: data })
        } catch (e: any) {
            app.panel?.webview.postMessage({ command: `query.execute.fetch.error`, payload: e.message })
        }
    }

    if (command === "query.execute.rawQuery") {
        try {
            const data = await connection.executeQuery(payload.rawQuery)
            app.panel?.webview.postMessage({ command: `query.execute.rawQuery.result`, payload: data })
        } catch (e: any) {
            app.panel?.webview.postMessage({ command: `query.execute.rawQuery.error`, payload: e.message })
        }
    }

    if (command === "query.execute.update") {
        try {
            const queries = connection.buildQueriesUpdate(payload.updates, queryConfig)
            const result = await connection.executeQueriesAndFetch(queries, queryConfig)
            app.panel?.webview.postMessage({ command: `query.execute.update.result`, payload: result })
            showMessage('Changes applied')
        } catch (e: any) {
            app.panel?.webview.postMessage({ command: `query.execute.update.error`, payload: e.message })
        }

    }

    if (command === "query.execute.delete") {
        try {
            const queries = connection.buildQueriesDelete(payload.deletes, queryConfig)
            const result = await connection.executeQueriesAndFetch(queries, queryConfig)
            app.panel?.webview.postMessage({ command: `query.execute.delete.result`, payload: result })
            showMessage('Deletions applied')
        } catch (e: any) {
            app.panel?.webview.postMessage({ command: `query.execute.delete.error`, payload: e.message })
        }
    }

    if (command === "query.execute.insert") {
        try {
            const queries = connection.buildQueriesInsert(payload.insertions, queryConfig)
            const result = await connection.executeQueriesAndFetch(queries, queryConfig)
            app.panel?.webview.postMessage({ command: `query.execute.insert.result`, payload: result })
            showMessage('Inserts applied')
        } catch (e: any) {
            app.panel?.webview.postMessage({ command: `query.execute.insert.error`, payload: e.message })
        }
    }

    if (command === "query.execute.preview") {
        try {
            const queriesInsert = connection.buildQueriesInsert(payload.insertions || { insertions: [], fields: [] }, queryConfig)
            const queriesFetch = connection.buildQueriesFetch(queryConfig)
            const queriesDelete = connection.buildQueriesDelete(payload.deletes || [], queryConfig)
            const queriesUpdate = connection.buildQueriesUpdate(payload.updates || [], queryConfig)
            app.panel?.webview.postMessage({
                command: `query.execute.preview.result`, payload: {
                    queriesDelete,
                    queriesFetch,
                    queriesInsert,
                    queriesUpdate,
                }
            })
        } catch (e: any) {
            app.panel?.webview.postMessage({ command: `query.execute.preview.error`, payload: e.message })
        }
    }

    if (command === "load.connectionConfig") {
        app.panel?.webview.postMessage({ command: `load.connectionConfig`, payload: app.connectionConfig })
    }

    if (command === "load.config") {
        app.panel?.webview.postMessage({ command: `load.config`, payload: config })
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
        app.panel?.webview.postMessage({ command: `export.chooseLocation.result`, payload: path })
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
            app.panel?.webview.postMessage({ command: `export.save.toFile.result` })
        } catch (e: any) {
            app.panel?.webview.postMessage({ command: `export.save.toFile.error`, payload: e.message })
        }
    }

    if (command === "export.load.completeDatabase") {
        try {
            const data = await connection.executeQueriesAndFetch([], {
                ...queryConfig,
                page: 0,
                pageResultsLimit: Number.MAX_SAFE_INTEGER,
            })
            app.panel?.webview.postMessage({ command: `export.load.completeDatabase.result`, payload: data })
        } catch (e: any) {
            app.panel?.webview.postMessage({ command: `export.load.completeDatabase.error`, payload: e.message })
        }
    }
}

function getHtmlBody(connectionConfig: PoolConnectionConfig): string {
    return /*html*/`
        <div id="header">
            <div class="header-row">
                <div class="pagination">
                    <div id="pagination-prev-skip" class="icon-small" title="First"><i class="codicon codicon-triangle-left"></i></div>
                    <div id="pagination-prev" title="Previous"><i class="codicon codicon-chevron-left"></i></div>
                    <div class="pagination-input">
                    <div id="pagination-rows-select" class="select" tabindex="9" title="Rows per page"></div>
                </select>
                <div id="pagination-rows-select-after" title="Total rows"></div>
                </div>
                <div id="pagination-next" title="Next"><i class="codicon codicon-chevron-right"></i></div>
                <div id="pagination-next-skip" class="icon-small" title="Last"><i class="codicon codicon-triangle-right"></i></div>
                </div>

                <div class="vertical-divider"></div>
                <div id="reload" title="Reload [Ctrl + Shift + r]"><i class="codicon codicon-refresh"></i></div>

                <div class="vertical-divider"></div>
                <div id="add-row" title="Add Row"><i class="codicon codicon-plus"></i></div>
                <div id="delete-rows" title="Delete Rows"><i class="codicon codicon-remove"></i></div>
                <div id="push-changes-preview" title="Preview Queries"><i class="codicon codicon-eye"></i></div>
                <div id="push-changes" class="success disabled" title="Push changes [Ctrl + Enter]"><i class="codicon codicon-arrow-up"></i></div>
                <div id="push-changes-loading" class="d-none">Loading...</div>

                <div class="vertical-divider"></div>
                <div id="selection-mode" title="Switch between Selection and Edit Mode [Ctrl + s]"><i class="codicon codicon-inspect"></i></div>

                <div class="vertical-divider"></div>
                <div id="export-data" title="Export data to a file or clipboard"><i class="codicon codicon-export"></i></div>

                <div class="vertical-divider"></div>
                <div class="spacer"></div>

                <div id="query-time-in-milliseconds" title="Query time in milliseconds"></div>

                <div class="vertical-divider"></div>
                <div id="settings" title="Open Table Settings"><i class="codicon codicon-settings-gear"></i></div>
            </div>
            <div class="header-row" id="header-filter">
                <div class="select" id="header-filter-select" tabindex="10"></div>
                <div class="vertical-divider"></div>
                <div id="header-filter-database">
                    <input id="header-filter-database-input" class="header-filter-input" value="${connectionConfig.advanced.filter.databasePrefilled || ''}">
                </div>
                <div id="header-filter-client">
                    <input id="header-filter-client-input" class="header-filter-input" value="${connectionConfig.advanced.filter.clientPrefilled || ''}">
                </div>
                <div id="header-filter-query">
                    <textarea id="header-filter-query-input" class="header-filter-input" value="${connectionConfig.advanced.filter.queryPrefilled || ''}"></textarea>
                    <i id="header-filter-query-run" class="codicon codicon-play success"></i>
                </div>
            </div>
            <div class="header-row d-none" id="error-message-container">
                <div class="icon error"><i class="codicon codicon-warning"></i></div>
                <pre id="error-message"></pre>
                <div class="icon error" id="error-close"><i class="codicon codicon-chrome-close"></i></div>
            </div>
    </div>
    <div id="readonly-notice" class=" ${connectionConfig.advanced.readonly ? '' : 'd-none'}">
        <div><i class="codicon codicon-lock"></i></div>
        <div class="readonly-text">Readonly. Edit your connection configuration to modify.</div>
    </div>
    <div id="loading">Loading...</div>
    <div id="popup" class="d-none">
        <div id="popup-content"></div>
        <div id="popup-close"><i class="codicon codicon-close"></i></div>
    </div>
    <div id="table-header"></div>
    <div id="table"></div>
    <div id="table-selection-context-menu" class="select-options">
        <div class="select-option" id="table-selection-context-menu-set-null">Set NULL</div>
        <div class="select-option" id="table-selection-context-menu-delete-row">Delete Row</div>
        <div class="select-option" id="table-selection-context-menu-delete-row-clear">Clear: Delete Row</div>
        <div class="horizontal-divider"></div>
        <div class="select-option" id="table-selection-context-menu-delete-rows">Selected Delete Rows</div>
        <div class="select-option" id="table-selection-context-menu-delete-rows-clear">Clear: Selected Delete Rows</div>
        <div class="horizontal-divider"></div>
        <div class="select-option" id="table-selection-context-menu-select-row">Select Row</div>
        <div class="select-option" id="table-selection-context-menu-select-column">Select Column</div>
        <div class="select-option" id="table-selection-context-menu-select-all">Select All</div>
    </div>
`
}

