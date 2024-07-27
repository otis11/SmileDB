import { OrderByConfig, QueryResultRow } from "../../../shared/types"
import { webviewGetConnectionConfig } from "../webview-internals"
import { getQueryResult, requestExecuteQueryFetch } from "./query"
import { renderTableResult } from "./table"

let lastOrderbyElement: HTMLElement | null
let lastOrderbyField = ''
let lastOrderbyDirection = ''
let orderBy: OrderByConfig | null = null
let tableRowsOriginal: QueryResultRow[] | null = null

export function getOrderByConfig() {
    return orderBy
}

export function setTableRowsOriginal(x: QueryResultRow[] | null) {
    tableRowsOriginal = x
}

export function onTableFieldOrderByClick(e: any) {
    const element = e.target.parentElement.parentElement
    const field = element.getAttribute('data-field') as string
    let direction = lastOrderbyDirection
    if (field !== lastOrderbyField) {
        direction = ''
    }


    if (lastOrderbyElement && field !== lastOrderbyField) {
        lastOrderbyElement.querySelector('.order-by-default-container')?.classList.remove('d-none')
        lastOrderbyElement.querySelector('.order-by-ascending-container')?.classList.add('d-none')
        lastOrderbyElement.querySelector('.order-by-descending-container')?.classList.add('d-none')
    }

    if (direction === '') {
        lastOrderbyDirection = 'descending'
        element.querySelector('.order-by-default-container')?.classList.add('d-none')
        element.querySelector('.order-by-descending-container')?.classList.remove('d-none')
        orderBy = {
            field,
            direction: 'descending'
        }
    }
    else if (direction === 'descending') {
        lastOrderbyDirection = 'ascending'
        element.querySelector('.order-by-descending-container')?.classList.add('d-none')
        element.querySelector('.order-by-ascending-container')?.classList.remove('d-none')
        orderBy = {
            field,
            direction: 'ascending'
        }
    } else if (direction === 'ascending') {
        lastOrderbyDirection = ''
        element.querySelector('.order-by-ascending-container')?.classList.add('d-none')
        element.querySelector('.order-by-default-container')?.classList.remove('d-none')
        orderBy = null
    }

    lastOrderbyElement = element
    lastOrderbyField = field

    const connectionConfig = webviewGetConnectionConfig()
    if (connectionConfig?.advanced.activeOrderByMethod === 'database') {
        requestExecuteQueryFetch()
    } else {
        orderByClientSide()
    }
}

export function renderOrderBy() {
    const direction = lastOrderbyDirection
    const element = document.querySelector(`.table-header-col[data-field="${lastOrderbyField}"]`)
    if (!element) {
        return
    }
    if (direction === 'descending') {
        element.querySelector('.order-by-default-container')?.classList.add('d-none')
        element.querySelector('.order-by-ascending-container')?.classList.add('d-none')
        element.querySelector('.order-by-descending-container')?.classList.remove('d-none')
    }
    else if (direction === 'ascending') {
        element.querySelector('.order-by-default-container')?.classList.add('d-none')
        element.querySelector('.order-by-descending-container')?.classList.add('d-none')
        element.querySelector('.order-by-ascending-container')?.classList.remove('d-none')
    } else if (direction === '') {
        element.querySelector('.order-by-ascending-container')?.classList.add('d-none')
        element.querySelector('.order-by-descending-container')?.classList.add('d-none')
        element.querySelector('.order-by-default-container')?.classList.remove('d-none')
    }
}

function orderByClientSide() {
    const queryResult = getQueryResult()
    let orderedRows: QueryResultRow[] = []
    if (orderBy?.direction === 'ascending') {
        orderedRows = sortAscending(queryResult?.rows, lastOrderbyField)
    } else if (orderBy?.direction === 'descending') {
        if (!tableRowsOriginal) {
            tableRowsOriginal = JSON.parse(JSON.stringify(queryResult?.rows))
        }
        orderedRows = sortDescending(queryResult?.rows, lastOrderbyField)
    } else {
        orderedRows = JSON.parse(JSON.stringify(tableRowsOriginal))
    }
    if (queryResult) {
        queryResult.rows = JSON.parse(JSON.stringify(orderedRows))
    }
    renderTableResult()
}

function sortDescending(arr?: QueryResultRow[], field?: string) {
    if (!arr || !field) {
        return []
    }
    return arr.sort((a: QueryResultRow, b: QueryResultRow) => {
        // @ts-ignore
        if (a[field] > b[field]) {
            return -1
        }
        // @ts-ignore
        else if (b[field] > a[field]) {
            return 1
        }
        return 0
    })
}

function sortAscending(arr?: QueryResultRow[], field?: string) {
    if (!arr || !field) {
        return []
    }
    return arr.sort((a: QueryResultRow, b: QueryResultRow) => {
        // @ts-ignore
        if (a[field] > b[field]) {
            return 1
        }
        // @ts-ignore
        else if (b[field] > a[field]) {
            return -1
        }
        return 0
    })
}
