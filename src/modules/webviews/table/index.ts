import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeDivider, vsCodeDropdown, vsCodeOption, vsCodeRadio, vsCodeRadioGroup, vsCodeTextArea, vsCodeTextField } from "@vscode/webview-ui-toolkit"
import { renderAddRow } from "./addRow"
import { renderDeleteRows } from "./deleteRows"
import { removeErrorMessage, showErrorMessage } from "./error"
import "./exportData"
import { setCompleteDatabaseExport, updateExportDataFolderLocation } from "./exportData"
import { renderFilterInput, renderFilterOptions, setActiveFilterAndFocus } from "./filter"
import { setLoading } from "./loading"
import { setTableRowsOriginal } from "./orderBy"
import { renderPagination, renderPaginationSelect, setPageResultsLimit, updatePagination } from "./pagination"
import "./popup"
import "./index.css"
import { closePopup } from "./popup"
import { onPushChangesClick, renderPushChanges, updateOnPushChangesState, updatePushChangesLoadingState } from "./push"
import { getQueryResult, openQueriesPreview, requestExecuteQueryFetch, setQueryResult, setQueryResultChanges, setQueryResultDeletions, setQueryResultInsertions, setQueryResultTimeInMilliseconds, updateQueryTimeInMilliseconds } from "./query"
import { renderTable, renderTableResult } from "./table"
import { copySelectedColumns, renderSelectionMode, setEditMode, toggleSelectionMode, updateSelectionMode, updateSelectionModeMenuOptions } from "./tableSelectionMode"
import { PoolConnectionConfig } from "../../../shared/types"
import { webviewOnConnectionConfigLoad, webviewOnExtensionConfigLoad, webviewRegisterShortcuts, webviewVscode } from "../webview-internals"

provideVSCodeDesignSystem().register(
    vsCodeButton(),
    vsCodeCheckbox(),
    vsCodeDivider(),
    vsCodeOption(),
    vsCodeDropdown(),
    vsCodeTextArea(),
    vsCodeTextField(),
    vsCodeRadio(),
    vsCodeRadioGroup()
)

const reloadElement = document.getElementById("reload") as HTMLElement

window.addEventListener('message', event => {
    removeErrorMessage()
    const message = event.data

    if (message.command === "query.execute.fetch.result") {
        setQueryResultChanges({})
        setQueryResultDeletions([])
        setQueryResultInsertions({})
        setQueryResult(message.payload)
        updatePagination(getQueryResult()?.stats.rowCount || 0)
        renderTableResult()
        setLoading(false)
        setTableRowsOriginal(null)
    }

    if (message.command === "query.execute.preview.result") {
        openQueriesPreview(message.payload)
    }

    if (message.command === "query.execute.rawQuery.result") {
        setQueryResultChanges({})
        setQueryResultDeletions([])
        setQueryResultInsertions({})
        setQueryResult(message.payload)
        updatePagination(getQueryResult()?.rows?.length || 0, true)
        renderTableResult()
        setLoading(false)
        setTableRowsOriginal(null)
    }

    if (message.command === "query.execute.update.result") {
        updatePushChangesLoadingState(false)
        // clear data changes, as its a new page with new data
        setQueryResultChanges({})
        setQueryResult(message.payload)
        updatePagination(getQueryResult()?.stats.rowCount || 0)
        renderTableResult()
    }

    if (message.command.includes('error')) {
        setTableRowsOriginal(null)
        setLoading(false)
        updatePushChangesLoadingState(false)
        showErrorMessage(`[${message.command}] Failed\n"${message.payload}`)
        setQueryResultTimeInMilliseconds(0)
    }

    if (message.command === "query.execute.insert.result") {
        updatePushChangesLoadingState(false)
        // clear data changes, as its a new page with new data
        setQueryResultInsertions({})
        setQueryResult(message.payload)
        updatePagination(getQueryResult()?.stats.rowCount || 0)
        renderTableResult()
    }

    if (message.command === "query.execute.delete.result") {
        updatePushChangesLoadingState(false)
        setQueryResultDeletions([])
        setQueryResultChanges({})
        setQueryResult(message.payload)
        updatePagination(getQueryResult()?.stats.rowCount || 0)
        renderTableResult()
    }

    if (message.command === 'export.chooseLocation.result') {
        updateExportDataFolderLocation(message.payload)
    }

    if (message.command === 'export.load.completeDatabase.result') {
        setCompleteDatabaseExport(message.payload)
        setLoading(false)
    }

    if (message.command === 'export.save.toFile.result') {
        closePopup()
    }

    updateOnPushChangesState()
    updateQueryTimeInMilliseconds()
    updateSelectionMode()
})


webviewOnExtensionConfigLoad((config => {
    setPageResultsLimit(config.table.pageResultsLimit)
    renderPaginationSelect(config.table.pageResultsLimitOptions)
    requestExecuteQueryFetch()
    setEditMode(config.table.defaultEditMode)
}))
webviewOnConnectionConfigLoad((connectionConfig: PoolConnectionConfig) => {
    renderFilterOptions(connectionConfig)
    updateSelectionModeMenuOptions(connectionConfig.advanced.readonly)
})
renderPagination()
renderTable()
renderPushChanges()
renderReload()
renderFilterInput()
renderSelectionMode()
renderAddRow()
renderDeleteRows()
webviewRegisterShortcuts([
    {
        keys: {
            Control: true,
            s: true,
        },
        callback: toggleSelectionMode
    },
    {
        keys: {
            Control: true,
            f: true,
        },
        callback: () => setActiveFilterAndFocus('client')
    },
    {
        keys: {
            Alt: true,
            d: true,
        },
        callback: () => setActiveFilterAndFocus('database')
    },
    {
        keys: {
            Alt: true,
            q: true,
        },
        callback: () => setActiveFilterAndFocus('query')
    },
    {
        keys: {
            Control: true,
            R: true,
        },
        callback: requestExecuteQueryFetch
    },
    {
        keys: {
            Control: true,
            Enter: true,
        },
        callback: onPushChangesClick
    },
    {
        keys: {
            Control: true,
            c: true,
        },
        callback: copySelectedColumns
    }
])

function renderReload() {
    reloadElement.onclick = () => {
        requestExecuteQueryFetch()
    }
}

document.getElementById('settings')?.addEventListener('click', () => {
    webviewVscode.postMessage({
        command: 'workbench.action.openSettings',
        payload: 'SmileDB.table'
    })
})
