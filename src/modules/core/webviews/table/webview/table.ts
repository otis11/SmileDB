import { QueryResultRow } from "../../../types"
import { createCodiconElement } from "../../webview-helper/codicon"
import { getConnectionConfig } from "../../webview-helper/connectionConfig"
import { htmlSanitizeValue } from "../../webview-helper/htmlSanitize"
import { logDebug } from "../../webview-helper/logger"
import { onTableFieldOrderByClick, renderOrderBy } from "./orderBy"
import { getPage, getPageResultsLimit } from "./pagination"
import { updateOnPushChangesState } from "./push"
import { getQueryResult, updateDataChanges, updateDataInsertions } from "./query"
import { addSelectionModeOverlayEventListeners, getIsSelectionModeActive } from "./tableSelectionMode"

const tableElement = document.getElementById("table")
const tableHeaderElement = document.getElementById("table-header")
let lastTableCol: number | null = null
let lastTableRow: number | null = null
let lastTableRowElement: HTMLElement | null = null

export function getTableElement() {
    return tableElement
}

export async function renderTableResult() {
    const queryResult = getQueryResult()
    if (!tableElement) {
        return
    }
    const startRenderTable = performance.now()

    renderTableHeader()
    if (queryResult?.rows.length === 0 && queryResult.fields.length === 0) {
        tableElement.innerHTML = '<div id="table-selection-mode-overlay" class="d-none"></div>'
        return
    }

    let tableElementString = ''
    const length = queryResult?.rows.length || 0
    for (let i = 0; i < length; i++) {
        if (queryResult?.rows[i]) {
            tableElementString += createTableRow(i, queryResult.rows[i])
        }
    }

    tableElementString += '<div id="table-selection-mode-overlay" class="d-none"></div>'
    tableElement.innerHTML = tableElementString
    requestAnimationFrame(() => {
        logDebug("Table render took: " + (performance.now() - startRenderTable).toFixed(2) + ' ms')
        const tableOverlay = document.getElementById('table-selection-mode-overlay')
        addSelectionModeOverlayEventListeners(tableOverlay)
        renderOrderBy()
    })
}

export function renderTable() {
    tableElement?.addEventListener('keydown', onTableKeydown)
    tableElement?.addEventListener('click', (e: any) => {
        if (getIsSelectionModeActive()) {
            return
        }

        const cell = e.target
        if (!cell.classList.contains('col')) {
            return
        }
        lastTableRowElement?.classList.remove('row--selected')
        lastTableCol = parseInt(cell.getAttribute('data-col'))
        lastTableRowElement = cell.parentElement
        lastTableRow = parseInt(lastTableRowElement?.getAttribute('data-row') || '')
        cell.parentElement.classList.add('row--selected')
    })
}

function renderTableHeader() {
    if (tableHeaderElement) {
        tableHeaderElement.innerHTML = ''
    }

    const queryResult = getQueryResult()
    // table header
    const tableRowHead = document.createElement("div")
    tableRowHead.classList.add("table-header-row")
    const lineNumber = document.createElement("div")
    lineNumber.classList.add("row-number")
    tableRowHead.appendChild(lineNumber)
    const l = queryResult?.fields.length || 0
    for (let i = 0; i < l; i++) {
        const rowHeadLeftElement = document.createElement('div')
        rowHeadLeftElement.classList.add("table-header-col-left")
        const rowHeadRightElement = document.createElement('div')
        rowHeadRightElement.classList.add("table-header-col-right")
        const rowHeadElement = document.createElement("div")
        rowHeadElement.classList.add("table-header-col")
        rowHeadElement.setAttribute('data-field', queryResult?.fields[i].name || '')
        rowHeadElement.setAttribute('data-direction', '')

        const rowHeadTopElement = document.createElement("div")
        const rowHeadBottomElement = document.createElement("div")
        rowHeadTopElement.classList.add("table-header-top")
        rowHeadBottomElement.classList.add("table-header-bottom")
        rowHeadBottomElement.innerText = queryResult?.fields[i].type || ''

        rowHeadTopElement.innerText = queryResult?.fields[i].name?.toString() || ''
        if (queryResult?.fields[i].flags.includes('primary')) {
            const iconContainer = document.createElement("span")
            iconContainer.classList.add("icon-small")
            iconContainer.title = 'primary'
            const iconPrimary = document.createElement("i")
            iconPrimary.classList.add("codicon", "codicon-key", "ml-1")
            iconContainer.appendChild(iconPrimary)
            rowHeadBottomElement.appendChild(iconContainer)
        }
        if (queryResult?.fields[i].flags.includes('notnull')) {
            const iconContainer = document.createElement("span")
            iconContainer.classList.add("icon-small")
            iconContainer.title = 'not null'
            const iconPrimary = document.createElement("i")
            iconPrimary.classList.add("codicon", "codicon-circle-slash", "ml-1")
            iconContainer.appendChild(iconPrimary)
            rowHeadBottomElement.appendChild(iconContainer)
        }
        if (queryResult?.fields[i].flags.includes('autoincrement')) {
            const iconContainer = document.createElement("span")
            iconContainer.classList.add("icon-small")
            iconContainer.title = 'autoincrement'
            const iconPrimary = document.createElement("i")
            iconPrimary.classList.add("codicon", "codicon-symbol-event", "ml-1")
            iconContainer.appendChild(iconPrimary)
            rowHeadBottomElement.appendChild(iconContainer)
        }
        if (queryResult?.fields[i].flags.includes('unique')) {
            const iconContainer = document.createElement("span")
            iconContainer.classList.add("icon-small")
            iconContainer.title = 'unique'
            const iconPrimary = document.createElement("i")
            iconPrimary.classList.add("codicon", "codicon-sparkle", "ml-1")
            iconContainer.appendChild(iconPrimary)
            rowHeadBottomElement.appendChild(iconContainer)
        }

        // order by icons
        const iconContainerOrderBy = document.createElement('div')
        iconContainerOrderBy.classList.add('order-by-container')
        const iconContainerOrderByDefault = document.createElement('div')
        const iconContainerOrderByUp = document.createElement('div')
        const iconContainerOrderByDown = document.createElement('div')
        iconContainerOrderByDefault.classList.add('order-by-default-container')
        iconContainerOrderByUp.classList.add('order-by-ascending-container')
        iconContainerOrderByUp.classList.add('d-none')
        iconContainerOrderByDown.classList.add('order-by-descending-container')
        iconContainerOrderByDown.classList.add('d-none')
        iconContainerOrderByUp.appendChild(createCodiconElement('triangle-up'))
        iconContainerOrderByDown.appendChild(createCodiconElement('triangle-down'))
        iconContainerOrderByDefault.appendChild(createCodiconElement('triangle-up', true))
        iconContainerOrderByDefault.appendChild(createCodiconElement('triangle-down', true))
        iconContainerOrderBy.append(iconContainerOrderByDefault, iconContainerOrderByUp, iconContainerOrderByDown)
        iconContainerOrderBy.addEventListener('click', onTableFieldOrderByClick)
        rowHeadRightElement.appendChild(iconContainerOrderBy)

        rowHeadLeftElement.append(rowHeadTopElement, rowHeadBottomElement)
        rowHeadElement.append(rowHeadLeftElement, rowHeadRightElement)
        tableRowHead.appendChild(rowHeadElement)
    }
    tableHeaderElement?.appendChild(tableRowHead)
}

async function onTableKeydown(e: any) {
    const cell = e.target
    if (!cell.classList.contains('col')) {
        return
    }

    lastTableCol = parseInt(cell.getAttribute('data-col'))
    lastTableRow = parseInt(cell.parentElement.getAttribute('data-row'))


    // await until div updates
    await new Promise(resolve => setTimeout(resolve, 0))

    if (cell.getAttribute('data-placeholder') === '<NULL>') {
        cell.removeAttribute('data-placeholder')
    }


    if (cell.parentElement.classList.contains('row--add')) {
        updateDataInsertions(lastTableRow, lastTableCol, cell.innerText)
    } else {
        updateDataChanges(lastTableRow, lastTableCol, cell.innerText)
    }
    updateOnPushChangesState()
}

export function createTableRow(i: number, row: QueryResultRow, isNewRow = false) {
    // row element and number
    const queryResult = getQueryResult()
    const connectionConfig = getConnectionConfig()
    let rowElementString = `<div class="row${isNewRow ? ' row--add' : ''}" data-row="${i}"><div class="row-number">${i + 1 + (getPage() * getPageResultsLimit())}</div>`
    for (let j = 0; j < Object.keys(row).length; j++) {
        const fieldName = queryResult?.fields[j].name || ''
        // cell attributes
        let cellElementString = `<div class="col" data-col="${j}"`

        if ((!connectionConfig?.advanced.readonly &&
            !queryResult?.fields[j].flags.includes('primary'))
            || isNewRow && !queryResult?.fields[j].flags.includes('autoincrement')
        ) {
            cellElementString += ' contenteditable'
        }
        if (row[fieldName] === null) {
            cellElementString += ' data-placeholder="<NULL>"'
        }

        cellElementString += '>'
        if (row[fieldName] !== null) {
            cellElementString += htmlSanitizeValue(row[fieldName]?.toString())
        }

        cellElementString += `</div>`
        rowElementString += cellElementString
    }
    rowElementString += '</div>'
    return rowElementString
}
