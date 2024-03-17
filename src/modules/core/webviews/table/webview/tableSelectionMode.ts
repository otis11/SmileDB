import { getConnectionConfig } from "../../webview-helper/connectionConfig"
import { copyToClipboard } from "../../webview-helper/copyToClipboard"
import { logError } from "../../webview-helper/logger"
import { selectTextInContentEditableDiv } from "../../webview-helper/selectTextInContentEditableDiv"
import { exportDataSeparatorDefaults } from "./exportData"
import { updateOnPushChangesState } from "./push"
import { getQueryResult, getQueryResultDeletions, setQueryResultDeletions, updateDataChanges } from "./query"
import { getTableElement } from "./table"

let isSelectionModeMouseDown = false
let selectionModeTableOffsetTop = 0
const selectionModeTableOffsetLeft = 40
let isSelectionModeActive = true
const colHeight = 26
const colWidth = 180
const selectionModeElement = document.getElementById('selection-mode') as HTMLElement
const tableSelectionContextMenuDeleteRowsElement = document.getElementById('table-selection-context-menu-delete-rows') as HTMLElement
const tableSelectionContextMenuDeleteRowsClearElement = document.getElementById('table-selection-context-menu-delete-rows-clear') as HTMLElement
const tableSelectionContextMenuDeleteRowElement = document.getElementById('table-selection-context-menu-delete-row') as HTMLElement
const tableSelectionContextMenuDeleteRowClearElement = document.getElementById('table-selection-context-menu-delete-row-clear') as HTMLElement
const tableSelectionContextMenuSelectRowElement = document.getElementById('table-selection-context-menu-select-row') as HTMLElement
const tableSelectionContextMenuSelectColumnElement = document.getElementById('table-selection-context-menu-select-column') as HTMLElement
const tableSelectionContextMenuSelectAllElement = document.getElementById('table-selection-context-menu-select-all') as HTMLElement
const tableSelectionContextMenuSetNullElement = document.getElementById('table-selection-context-menu-set-null') as HTMLElement
const tableSelectionContextMenuElement = document.getElementById('table-selection-context-menu') as HTMLElement
let contextMenuTopLeftPosition = {
    row: 0,
    col: 0
}

export function addSelectionModeOverlayEventListeners(overlayElement: HTMLElement | null) {
    if (overlayElement) {
        overlayElement.addEventListener('mousedown', onSelectionModeMouseDown)
        overlayElement.addEventListener('mouseup', onSelectionModeMouseUp)
        overlayElement.addEventListener('mousemove', onSelectionModeMouseMove)
        overlayElement.addEventListener('contextmenu', onSelectionModeContextMenu)
        overlayElement.addEventListener('dblclick', onSelectionModeDoubleClick)
        updateSelectionModeOffset()
    }
}

export function updateSelectionModeOffset() {
    selectionModeTableOffsetTop = getTableElement()?.offsetTop || 0
}

export function getIsSelectionModeActive() {
    return isSelectionModeActive
}

export function renderSelectionMode() {
    selectionModeElement?.addEventListener('click', () => {
        toggleSelectionMode()
    })
    renderSelectionModeContextMenu()
}

export function toggleSelectionMode() {
    isSelectionModeActive = !isSelectionModeActive
    updateSelectionMode()
}

export function setEditMode(mode: 'Edit' | 'Select') {
    if (mode === 'Edit') {
        isSelectionModeActive = false
    } else {
        isSelectionModeActive = true
    }
    updateSelectionMode()
}

export function updateSelectionMode() {
    if (!selectionModeElement) {
        return
    }

    const selectionModeOverlayElement = document.getElementById('table-selection-mode-overlay') as HTMLElement
    if (isSelectionModeActive) {
        selectionModeElement.innerHTML = '<i class="codicon codicon-edit"></i>'
        selectionModeOverlayElement?.classList.remove('d-none')
    } else {
        selectionModeElement.innerHTML = '<i class="codicon codicon-inspect"></i>'
        selectionModeOverlayElement?.classList.add('d-none')
        selectionModeClearSelectedCols()
    }
}

function onSelectionModeDoubleClick(e: MouseEvent) {
    const { row, col } = getTargetRowColSelectionMode(e)

    const tableElement = getTableElement()
    const rowElement = tableElement?.children[row]

    const colElement = rowElement?.children[col + 1] as HTMLDivElement

    colElement?.focus()
    selectTextInContentEditableDiv(colElement)
    selectionModeClearSelectedCols()
}

function onSelectionModeContextMenu(e: MouseEvent) {
    e.preventDefault()
    contextMenuTopLeftPosition = getTargetRowColSelectionMode(e)

    if (tableSelectionContextMenuElement) {
        tableSelectionContextMenuElement.style.display = 'block'
        tableSelectionContextMenuElement.style.left = e.clientX + 'px'
        tableSelectionContextMenuElement.style.top = e.clientY + 'px'
    }

    const queryResult = getQueryResult()
    if (queryResult?.fields[contextMenuTopLeftPosition.col].flags.includes('notnull')) {
        tableSelectionContextMenuSetNullElement.classList.add('disabled')
    } else {
        if (!getConnectionConfig()?.advanced.readonly) {
            tableSelectionContextMenuSetNullElement.classList.remove('disabled')
        }
    }
}

function onSelectionModeMouseDown(e: MouseEvent) {
    // right click for context menu
    if (e.button === 2) {
        return
    }
    isSelectionModeMouseDown = true
    selectionModeClearSelectedCols()
}

function selectionModeClearSelectedCols() {
    const tableElement = getTableElement()
    const selectedCols = tableElement?.querySelectorAll('.col--selected')
    if (selectedCols) {
        for (let i = 0; i < selectedCols.length; i++) {
            selectedCols[i].classList.remove('col--selected')
        }
    }
}

function onSelectionModeMouseUp(e: MouseEvent) {
    // right click for context menu
    if (e.button === 2) {
        return
    }
    isSelectionModeMouseDown = false

    const { row, col } = getTargetRowColSelectionMode(e)

    const tableElement = getTableElement()
    const rowElement = tableElement?.children[row]
    rowElement?.children[col + 1].classList.add('col--selected')
    rowElement?.firstElementChild?.classList.add('col--selected')
}

function onSelectionModeMouseMove(e: MouseEvent) {
    if (!isSelectionModeMouseDown) {
        return
    }

    const { row, col } = getTargetRowColSelectionMode(e)

    const tableElement = getTableElement()
    const rowElement = tableElement?.children[row]
    rowElement?.children[col + 1].classList.add('col--selected')
    rowElement?.firstElementChild?.classList.add('col--selected')
}

function getTargetRowColSelectionMode(e: MouseEvent) {
    return {
        row: Math.floor((e.pageY - selectionModeTableOffsetTop) / colHeight),
        col: Math.floor((e.pageX - selectionModeTableOffsetLeft) / colWidth),
    }
}

export function addSelectedRowsToDeletion() {
    const tableElement = getTableElement()
    const rowSelectedNumberElements = tableElement?.querySelectorAll('.row:not(.row--add) .row-number.col--selected')
    const rows: number[] = []
    if (rowSelectedNumberElements) {
        for (let i = 0; i < rowSelectedNumberElements?.length; i++) {
            const rowElement = rowSelectedNumberElements[i].parentElement
            rowElement?.classList.add('row--delete')
            const rowNumberString = rowElement?.getAttribute('data-row')
            if (rowNumberString) {
                rows.push(parseInt(rowNumberString))
            }
        }
    }

    setQueryResultDeletions([...getQueryResultDeletions(), ...rows])
    updateOnPushChangesState()
}

export function copySelectedColumns() {
    // if there is something selected, prefer the selection
    const selection = window.getSelection()?.toString()
    if (selection) {
        copyToClipboard(selection)
        return
    }

    const tableElement = getTableElement()
    const selectedColumns = tableElement?.querySelectorAll('div.col--selected')
    if (selectedColumns === undefined || selectedColumns.length === 0) {
        return // noting to copy
    }

    let content = ''
    for (let i = 0; i < selectedColumns.length; i++) {
        const col = selectedColumns[i]
        if (col.classList.contains('row-number')) {
            // remove extra separator at end of last column and add newline
            if (i !== 0) {
                content = content.slice(0, -1) + '\n'
            }
            continue
        }
        let value = col.innerHTML
        if (value.includes(',')) {
            value = `"${value}"`
        }
        content += value + exportDataSeparatorDefaults['CSV']
    }
    // remove last separator, maybe improve that separator only gets added at the correct locations
    copyToClipboard(content.slice(0, -1))
}

export function renderSelectionModeContextMenu() {
    const tableElement = getTableElement()
    tableSelectionContextMenuDeleteRowsElement?.addEventListener('click', addSelectedRowsToDeletion)

    tableSelectionContextMenuDeleteRowsClearElement?.addEventListener('click', () => {
        const rowSelectedNumberElements = tableElement?.querySelectorAll('.row-number.col--selected')
        const rows: number[] = []
        if (rowSelectedNumberElements) {
            for (let i = 0; i < rowSelectedNumberElements?.length; i++) {
                const rowElement = rowSelectedNumberElements[i].parentElement
                rowElement?.classList.remove('row--delete')
                const rowNumberString = rowElement?.getAttribute('data-row')
                if (rowNumberString) {
                    rows.push(parseInt(rowNumberString))
                }
            }
        }

        setQueryResultDeletions(getQueryResultDeletions().filter(rowNumber => !rows.includes(rowNumber)))
        updateOnPushChangesState()
    })

    tableSelectionContextMenuSelectRowElement.addEventListener('click', () => {
        const row = tableElement?.children[contextMenuTopLeftPosition.row]
        if (!row) {
            logError('Error selecting row (row not found)', row)
            return
        }
        for (let i = 0; i < row?.children.length || 0; i++) {
            row.children[i].classList.add('col--selected')
        }
    })

    tableSelectionContextMenuSelectColumnElement.addEventListener('click', () => {
        if (!tableElement) {
            logError('Error selecting all (tableElement not found)', tableElement)
            return
        }
        for (let i = 0; i < tableElement.children.length || 0; i++) {
            const col = tableElement.children[i].children[contextMenuTopLeftPosition.col + 1]
            col.classList.add('col--selected')
        }
    })

    tableSelectionContextMenuSelectAllElement.addEventListener('click', () => {
        if (!tableElement) {
            logError('Error selecting all (tableElement not found)', tableElement)
            return
        }
        for (let i = 0; i < tableElement.children.length || 0; i++) {
            const row = tableElement.children[i]
            for (let i = 0; i < row.children.length || 0; i++) {
                row.children[i].classList.add('col--selected')
            }
        }

    })

    tableSelectionContextMenuDeleteRowElement.addEventListener('click', () => {
        tableElement?.children[contextMenuTopLeftPosition.row].classList.add('row--delete')
        setQueryResultDeletions([...getQueryResultDeletions(), contextMenuTopLeftPosition.row])
        updateOnPushChangesState()
    })

    tableSelectionContextMenuDeleteRowClearElement.addEventListener('click', () => {
        tableElement?.children[contextMenuTopLeftPosition.row].classList.remove('row--delete')
        setQueryResultDeletions(getQueryResultDeletions().filter(rowNumber => rowNumber !== contextMenuTopLeftPosition.row))
        updateOnPushChangesState()
    })

    tableSelectionContextMenuSetNullElement.addEventListener('click', () => {
        const target = tableElement?.children[contextMenuTopLeftPosition.row].children[contextMenuTopLeftPosition.col + 1]
        if (target) {
            target.setAttribute('data-placeholder', '<NULL>')
            target.innerHTML = ''
        }
        updateDataChanges(contextMenuTopLeftPosition.row, contextMenuTopLeftPosition.col, null)
        updateOnPushChangesState()
    })

    window.addEventListener('click', () => {
        if (tableSelectionContextMenuElement) {
            tableSelectionContextMenuElement.style.display = 'none'
        }
    })
}

export function updateSelectionModeMenuOptions(readonly: boolean) {
    if (readonly) {
        tableSelectionContextMenuDeleteRowsClearElement.classList.add('disabled')
        tableSelectionContextMenuDeleteRowClearElement.classList.add('disabled')
        tableSelectionContextMenuDeleteRowsElement.classList.add('disabled')
        tableSelectionContextMenuDeleteRowElement.classList.add('disabled')
        tableSelectionContextMenuSetNullElement.classList.add('disabled')
    }
}
