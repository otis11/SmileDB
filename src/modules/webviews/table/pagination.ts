import { getRowCount, requestExecuteQueryFetch } from "./query"
import { renderSelectWithId } from "./select"

const paginationNextElement = document.getElementById("pagination-next")
const paginationNextSkipElement = document.getElementById("pagination-next-skip")
const paginationPrevElement = document.getElementById("pagination-prev")
const paginationPrevSkipElement = document.getElementById("pagination-prev-skip")
const paginationRowsSelectElement = document.getElementById('pagination-rows-select')
const paginationRowsSelectAfterElement = document.getElementById('pagination-rows-select-after')
let page = 0
let lastPage = 0
let pageResultsLimit = 100

export function setPageResultsLimit(limit: number) {
    pageResultsLimit = limit
}

export function getPageResultsLimit() {
    return pageResultsLimit
}

export function getPage() {
    return page
}

export function renderPagination() {
    if (paginationNextElement) {
        paginationNextElement.onclick = onPaginationNextClick
    }
    if (paginationPrevElement) {
        paginationPrevElement.onclick = onPaginationPrevClick
    }
    if (paginationNextSkipElement) {
        paginationNextSkipElement.onclick = onPaginationNextSkipClick
    }
    if (paginationPrevSkipElement) {
        paginationPrevSkipElement.onclick = onPaginationPrevSkipClick
    }
}

function onPaginationSelectChange(el: HTMLElement) {
    pageResultsLimit = parseInt(el.innerText)
    updatePagination(getRowCount())
    requestExecuteQueryFetch()
}

export function updatePagination(rowCount: number, showRowCountOnly = false) {
    lastPage = Math.floor(rowCount / pageResultsLimit)
    if (page > lastPage) {
        // well filter fucked it, request again but page now has result stuff
        page = lastPage
        requestExecuteQueryFetch()
    }

    if (showRowCountOnly) {
        page = 0
        lastPage = 0
    }
    const selectValue = page * pageResultsLimit + '-' + (page + 1) * pageResultsLimit
    requestAnimationFrame(() => {
        const selectValueElement = paginationRowsSelectElement?.querySelector('.select-value')
        if (selectValueElement instanceof HTMLElement) {
            selectValueElement.innerText = selectValue
        }
    })

    if (paginationRowsSelectAfterElement) {
        const rowCountSelectElement = document.getElementById('pagination-rows-select')
        const r = rowCount || 0
        if (showRowCountOnly) {
            rowCountSelectElement?.classList.add('d-none')
            paginationRowsSelectAfterElement.innerText = `${r}`
        } else {
            rowCountSelectElement?.classList.remove('d-none')
            paginationRowsSelectAfterElement.innerText = `of ${r}`
        }
    }

    if (page === 0) {
        paginationPrevElement?.classList.add("disabled")
        paginationPrevSkipElement?.classList.add("disabled")
    } else {
        paginationPrevElement?.classList.remove("disabled")
        paginationPrevSkipElement?.classList.remove("disabled")
    }
    if (page === lastPage) {
        paginationNextElement?.classList.add("disabled")
        paginationNextSkipElement?.classList.add("disabled")
    } else {
        paginationNextElement?.classList.remove("disabled")
        paginationNextSkipElement?.classList.remove("disabled")
    }
}

export function renderPaginationSelect(limitOptions: number[]) {
    renderSelectWithId(
        'pagination-rows-select',
        [pageResultsLimit, ...limitOptions].map(value => '<div class="select-option">' + value + '</div>'),
        onPaginationSelectChange
    )
}

function onPaginationNextClick() {
    page++
    requestExecuteQueryFetch()
}

function onPaginationPrevClick() {
    page--
    requestExecuteQueryFetch()
}

function onPaginationNextSkipClick() {
    page = lastPage
    requestExecuteQueryFetch()
}

function onPaginationPrevSkipClick() {
    page = 0
    requestExecuteQueryFetch()
}
