import { AllowedFilterMethod, PoolConnectionConfig } from "../../../types";
import { getQueryResult, requestExecuteQuery, requestExecuteQueryFetch } from "./query";
import { renderSelectWithId } from "./select";
import { getTableElement } from "./table";

const headerFilterClientInputElement = document.getElementById('header-filter-client-input') as HTMLInputElement;
const headerFilterClientElement = document.getElementById('header-filter-client') as HTMLInputElement;
const headerFilterDatabaseInputElement = document.getElementById('header-filter-database-input') as HTMLInputElement;
const headerFilterDatabaseElement = document.getElementById('header-filter-database') as HTMLInputElement;
const headerFilterQueryInputElement = document.getElementById('header-filter-query-input') as HTMLInputElement;
const headerFilterQueryElement = document.getElementById('header-filter-query') as HTMLInputElement;
const headerFilterQueryRunElement = document.getElementById('header-filter-query-run') as HTMLInputElement;


let activeFilterInput: AllowedFilterMethod | null = null;
let filterInputDebounceInMilliseonds = 95;
let filterInputDebounceTimeout: number | null | NodeJS.Timeout = null;
let filterInputClientString = '';
let filterInputDatabaseString = '';

export function getFilterDatabaseString() {
    return filterInputDatabaseString;
}

export function renderFilterInput() {
    headerFilterClientInputElement?.addEventListener('input', (e) => {
        if (filterInputDebounceTimeout) {
            clearTimeout(filterInputDebounceTimeout);
        }

        filterInputDebounceTimeout = setTimeout(() => {
            filterInputClientString = headerFilterClientInputElement?.value || '';
            applyClientSearch();
        }, filterInputDebounceInMilliseonds);
    });

    headerFilterDatabaseInputElement?.addEventListener('input', (e) => {
        filterInputDatabaseString = headerFilterDatabaseInputElement?.value || '';
    });

    headerFilterDatabaseInputElement?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            requestExecuteQueryFetch();
        }
    });

    // on resize textarea
    new ResizeObserver(() => {
        const body = document.querySelector('body');
        if (body) {
            const headerHeight = Math.max(59, headerFilterQueryInputElement.offsetHeight + 30);
            body.style.paddingTop = `${headerHeight}px`;
        }
    }).observe(headerFilterQueryInputElement);

    headerFilterQueryRunElement.addEventListener('click', (e) => {
        const query = headerFilterQueryInputElement.value;
        requestExecuteQuery(query);
    });
}

function onFilterSelectChange(el: HTMLElement) {
    activeFilterInput = el.getAttribute('data-value') as AllowedFilterMethod;
    renderActiveFilter();
}

function renderActiveFilter() {
    if (activeFilterInput === 'client') {
        headerFilterDatabaseElement?.classList.add('d-none');
        headerFilterQueryElement?.classList.add('d-none');
        headerFilterClientElement?.classList.remove('d-none');
        filterInputClientString = headerFilterClientInputElement?.value || '';
        filterInputDatabaseString = '';
    } else if (activeFilterInput === 'database') {
        headerFilterClientElement?.classList.add('d-none');
        headerFilterQueryElement?.classList.add('d-none');
        headerFilterDatabaseElement?.classList.remove('d-none');
        filterInputDatabaseString = headerFilterDatabaseInputElement?.value || '';
        filterInputClientString = '';
    } else {
        headerFilterClientElement?.classList.add('d-none');
        headerFilterDatabaseElement?.classList.add('d-none');
        headerFilterQueryElement?.classList.remove('d-none');
        filterInputDatabaseString = headerFilterDatabaseInputElement?.value || '';
        filterInputClientString = '';
    }
}

export async function setActiveFilterAndFocus(method: AllowedFilterMethod) {
    activeFilterInput = method;
    const valueElement = document.querySelector('#header-filter-select .select-value');
    if (valueElement) {
        const methodHtmlOption = document.querySelector(`#header-filter-select .select-option[data-value="${method}"]`) as HTMLDivElement;
        valueElement.innerHTML = methodHtmlOption.outerHTML;
    }
    renderActiveFilter();

    // focus
    if (method === 'client') {
        headerFilterClientInputElement.focus();
    } else if (method === 'database') {
        headerFilterDatabaseInputElement.focus();
    } else {
        headerFilterQueryInputElement.focus();
    }
}

function applyClientSearch() {
    const queryResult = getQueryResult();
    if (!queryResult) {
        return;
    };

    const tableElement = getTableElement();
    const searchHitElements = tableElement?.querySelectorAll('.col--search');
    if (searchHitElements) {
        for (let i = 0; i < searchHitElements.length; i++) {
            searchHitElements[i].classList.remove('col--search');
        }
    }

    if (!filterInputClientString) {
        // remove all row d-nones as client search string is not set
        if (tableElement) {
            for (let i = 0; i < tableElement.children.length; i++) {
                tableElement.children[i].classList.remove('d-none');
            }
        }
        return;
    }

    let searchMatchRows: number[] = [];
    const fieldNames = queryResult.fields.map(f => f.name);
    for (let i = 0; i < queryResult.rows.length; i++) {
        for (let j = 0; j < fieldNames.length; j++) {
            if (queryResult.rows[i][fieldNames[j]]?.toString().toLowerCase().includes(filterInputClientString.toLowerCase())) {
                if (searchMatchRows.includes(i)) {
                    // row already tagged
                } else {
                    // row new find
                    if (tableElement) {
                        tableElement.children[i].classList.remove('d-none');
                    }
                    searchMatchRows.push(i);
                }
                // tag col
                if (tableElement) {
                    tableElement.children[i].children[j + 1].classList.add('col--search');
                }
            } else if (!searchMatchRows.includes(i)) {
                // add d-none as row has no search match
                if (tableElement) {
                    tableElement.children[i].classList.add('d-none');
                }
            }
        }
    }
}

export function renderFilterOptions(connectionConfig: PoolConnectionConfig) {
    const selectOptions = [`<div class="select-option" data-value="client"><i class="codicon codicon-search" data-value="client"></i> <span data-value="client">${connectionConfig?.advanced.filter.clientPlaceholder}</span></div>`];
    if (connectionConfig?.advanced.filter.allowedMethods.includes('database')) {
        selectOptions.unshift(`<div class="select-option" data-value="database"><i class="codicon codicon-filter-filled" data-value="database"></i> <span data-value="database">${connectionConfig?.advanced.filter.databasePlaceholder}</span></div>`);
    }
    if (connectionConfig?.advanced.filter.allowedMethods.includes('query')) {
        selectOptions.push(`<div class="select-option" data-value="query"><i class="codicon codicon-terminal" data-value="query"></i> <span data-value="query">${connectionConfig?.advanced.filter.queryPlaceholder}</span></div>`);
    }
    renderSelectWithId(
        'header-filter-select',
        selectOptions,
        onFilterSelectChange
    );
    activeFilterInput = connectionConfig?.advanced.filter.activeMethod || null;
}
