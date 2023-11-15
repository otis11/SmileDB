import { QueryResult, QueryResultField, QueryResultRow } from "../../../types";
import { htmlSanitizeValue } from "../../webview-helper/htmlSanitize";
import { vscode } from "../../webview-helper/vscode";
import { getFilterDatabaseString } from "./filter";
import { setLoading } from "./loading";
import { getOrderByConfig } from "./orderBy";
import { getPage, getPageResultsLimit } from "./pagination";
import { openPopup } from "./popup";
import { getTableElement } from "./table";

const queryTimeInMillisecondsElement = document.getElementById('query-time-in-milliseconds');
type RowCol = {
    [key: number]: QueryResultRow
};
let queryResultChanges: RowCol = {};
let queryResultInsertions: RowCol = {};
let queryResultDeletions: number[] = [];
let queryResult: QueryResult | null = null;

export function getRowCount() {
    return queryResult?.stats.rowCount || 0;
}

export function getQueryResult() {
    return queryResult;
}

export function getQueryResultChanges() {
    return queryResultChanges;
}

export function setQueryResultChanges(x: RowCol) {
    queryResultChanges = x;
}

export function getQueryResultInsertions() {
    return queryResultInsertions;
}

export function setQueryResultInsertions(insertions: RowCol) {
    queryResultInsertions = insertions;
}

export function setQueryResultDeletions(x: number[]) {
    queryResultDeletions = x;
}

export function getQueryResultDeletions() {
    return queryResultDeletions;
}

export function setQueryResult(qr: QueryResult | null) {
    queryResult = qr;
}

export function setQueryResultTimeInMilliseconds(timeInMilliseconds: number) {
    if (queryResult) {
        queryResult.stats.timeInMilliseconds = timeInMilliseconds;
    }
}


function getFetchQueryPayload() {
    return {
        page: getPage(),
        pageResultsLimit: getPageResultsLimit(),
        orderBy: getOrderByConfig(),
        filterString: getFilterDatabaseString(),
    };
}

export function requestExecuteQueryFetch() {
    setLoading(true);
    getTableElement()?.classList.add("hidden");
    vscode.postMessage({
        command: 'query.execute.fetch',
        payload: getFetchQueryPayload()
    });
}

export function requestExecuteQueryDelete(rows: number[]) {
    const deletes = createDeletesForQueryChanges(rows);
    vscode.postMessage({
        command: 'query.execute.delete',
        payload: {
            ...getFetchQueryPayload(),
            deletes,
        }
    });
}

function createQueryInsertions() {
    const queryAdditions: QueryResultRow[] = [];
    for (const row of Object.keys(queryResultInsertions)) {
        queryAdditions.push(queryResultInsertions[parseInt(row)]);
    }
    return {
        insertions: queryAdditions,
        fields: queryResult?.fields,
    };
}

function createUpdatesForQueryChanges() {
    const fields = getFieldsToIdentifyUpdate();
    const queryUpdates = [];
    for (const row of Object.keys(queryResultChanges)) {
        const rowNumber = parseInt(row);
        const update = queryResultChanges[rowNumber];
        const where: QueryResultRow = {};
        for (let i = 0; i < fields.length; i++) {
            where[fields[i].name] = queryResult?.rows[rowNumber][fields[i].name] || null;
        }

        queryUpdates.push({
            where,
            update,
        });
    }
    return queryUpdates;
}

function getFieldsToIdentifyUpdate(): QueryResultField[] {
    if (!queryResult?.fields) {
        return [];
    }

    let fields = queryResult.fields.flatMap(field => {
        if (field.flags.includes('primary') || field.flags.includes('unique')) {
            return field;
        }
        return [];
    });
    // no fields to identify change?
    if (fields?.length === 0) {
        return queryResult.fields;
    }
    return fields;
}

function createDeletesForQueryChanges(rows: number[]) {
    const fields = getFieldsToIdentifyUpdate();
    const queryUpdates = [];
    for (const row of rows) {
        const where: QueryResultRow = {};
        for (let i = 0; i < fields.length; i++) {
            where[fields[i].name] = queryResult?.rows[row][fields[i].name] || null;
        }

        queryUpdates.push({
            where,
        });
    }
    return queryUpdates;
}

export function updateQueryTimeInMilliseconds() {
    if (!queryTimeInMillisecondsElement) {
        return;
    }
    let milliseconds = queryResult?.stats.timeInMilliseconds;
    if (typeof milliseconds !== 'number') {
        milliseconds = 0;
    }
    queryTimeInMillisecondsElement.innerText = milliseconds + 'ms';
}

export function requestExecuteQueries() {
    // update
    if (Object.keys(queryResultChanges).length > 0) {
        const updates = createUpdatesForQueryChanges();
        vscode.postMessage({
            command: 'query.execute.update',
            payload: {
                ...getFetchQueryPayload(),
                updates,
            }
        });
    }

    // delete
    if (queryResultDeletions.length > 0) {
        requestExecuteQueryDelete(queryResultDeletions);
    }

    // insert
    if (Object.keys(queryResultInsertions).length > 0) {
        const insertions = createQueryInsertions();
        vscode.postMessage({
            command: 'query.execute.insert',
            payload: {
                ...getFetchQueryPayload(),
                insertions,
            }
        });
    }
}

export function requestExecuteQueriesPreview() {
    const payload: any = {
        ...getFetchQueryPayload()
    };

    // update
    if (Object.keys(queryResultChanges).length > 0) {
        const updates = createUpdatesForQueryChanges();
        payload.updates = updates;
    }

    // delete
    if (queryResultDeletions.length > 0) {
        const deletes = createDeletesForQueryChanges(queryResultDeletions);
        payload.deletes = deletes;
    }

    // insert
    if (Object.keys(queryResultInsertions).length > 0) {
        const insertions = createQueryInsertions();
        payload.insertions = insertions;
    }

    vscode.postMessage({
        command: 'query.execute.preview',
        payload,
    });
}

export function updateDataInsertions(row: number, col: number, value: any) {
    const fieldName = queryResult?.fields[col].name || '';
    if (!queryResultInsertions[row]) {
        queryResultInsertions[row] = {
            [fieldName]: value
        };
    } else {
        queryResultInsertions[row][fieldName] = value;
    }
}

export function addEmptyDataAddition(row: number) {
    queryResultInsertions[row] = {};
    if (queryResult?.fields) {
        for (let i = 0; i < queryResult.fields.length; i++) {
            if (!queryResult.fields[i].flags.includes('autoincrement')) {
                queryResultInsertions[row][queryResult.fields[i].name] = '';
            }
        }
    }
}

export function updateDataChanges(row: number, col: number, value: any) {
    const fieldName = queryResult?.fields[col].name || '';
    const tableElement = getTableElement();
    if (value === queryResult?.rows[row][fieldName]) {
        if (!queryResultChanges[row]) {
            // do nothing
        }
        else if (Object.keys(queryResultChanges[row]).length === 1) {
            delete queryResultChanges[row];
            tableElement?.children[row].children[col + 1].classList.remove('col--change');
            tableElement?.children[row].children[0].classList.remove('col--change');
        } else {
            delete queryResultChanges[row][fieldName];
            tableElement?.children[row].children[col + 1].classList.remove('col--change');
        }
    } else {
        if (!queryResultChanges[row]) {
            queryResultChanges[row] = {
                [fieldName]: value
            };
        } else {
            queryResultChanges[row][fieldName] = value;
        }
        tableElement?.children[row].children[col + 1].classList.add('col--change');
        tableElement?.children[row].children[0].classList.add('col--change');
    }
}

export function requestExecuteQuery(rawQuery: string) {
    setLoading(true);
    getTableElement()?.classList.add("hidden");
    vscode.postMessage({
        command: 'query.execute.rawQuery',
        payload: {
            rawQuery,
        }
    });
}

export function openQueriesPreview(payload: any) {
    openPopup(`
            <h2>Query Preview</h2>
            ${createQueryPreviewElement('Insert', payload.queriesInsert)}
            ${createQueryPreviewElement('Delete', payload.queriesDelete)}
            ${createQueryPreviewElement('Update', payload.queriesUpdate)}
            ${createQueryPreviewElement('Fetch', payload.queriesFetch)}
        `);
}

function createQueryPreviewElement(title: string, queries: string[]) {
    if (!queries) {
        return '';
    }
    let queriesTitle = '<div class="queries-preview-title">-- ' + htmlSanitizeValue(title) + '</div>';
    let preString = '<pre>';
    for (let i = 0; i < queries.length; i++) {
        const element = queries[i];
        preString += htmlSanitizeValue(element) + '\n';
    }
    preString += '</pre>';
    return queriesTitle + preString;
}
