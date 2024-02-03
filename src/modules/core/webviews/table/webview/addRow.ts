import { QueryResultRow } from "pg"
import { createElementFromHTMLString } from '../../webview-helper/createElementFromHtmlString'
import { updateOnPushChangesState } from "./push"
import { addEmptyDataAddition, getQueryResult } from "./query"
import { createTableRow, getTableElement } from "./table"
import { addSelectionModeOverlayEventListeners } from "./tableSelectionMode"

const addElement = document.getElementById('add-row')

export function renderAddRow() {
    addElement?.addEventListener('click', async () => {
        const tableElement = getTableElement()
        const lastRow = getTableRowCount()
        const rowHtmlString = createTableRow(lastRow, createEmptyQueryResultRow(), true)
        if (tableElement) {
            let tableOverlay = document.getElementById('table-selection-mode-overlay')
            tableElement?.insertBefore(createElementFromHTMLString(rowHtmlString), tableOverlay)
            // await until div updates
            await new Promise(resolve => setTimeout(resolve, 0))
            addEmptyDataAddition(lastRow)
            updateOnPushChangesState()
            // scroll to new row
            tableElement.querySelector(`[data-row="${lastRow}"]`)?.scrollIntoView({ block: 'end', behavior: 'smooth' })
            // todo remove or improve idk why its needed here
            requestAnimationFrame(() => {
                tableOverlay = document.getElementById('table-selection-mode-overlay')
                addSelectionModeOverlayEventListeners(tableOverlay)
            })
        }
    })
}

export function getTableRowCount() {
    return getTableElement()?.querySelectorAll('.row').length || 0
}

function createEmptyQueryResultRow(): QueryResultRow {
    const result = getQueryResult()
    const emptyQueryResultRow: QueryResultRow = {}
    result?.fields.map(field => {
        if (field.flags.includes('autoincrement')) {
            emptyQueryResultRow[field.name] = '&lt;AUTOINCREMENT&gt;'
        } else {
            emptyQueryResultRow[field.name] = ''
        }
    }) || {}
    return emptyQueryResultRow
}
