import { logError, logWarn } from "../../webview-helper/logger";
import { QueryResult } from "../../../types";
import { openPopup } from "./popup";
import { getQueryResult } from "./query";
import { vscode } from "../../webview-helper/vscode";
import { getConnectionConfig } from "../../webview-helper/connectionConfig";
import { setLoading } from "./loading";

type ExportDataFormat = 'CSV' | 'TXT';
type ExportDataScope = 'current' | 'complete';
const exportDataElement = document.getElementById('export-data');
const updatePreviewChangeListenerIds = [
    'export-add-row-header',
    'export-add-column-header',
    'export-data-format',
];
let exportDataPreviewRowsCount = 5;
let exportDataSeparator = ',';
const exportDataSeparatorDefaults: Record<ExportDataFormat, string> = {
    CSV: ',',
    TXT: '    ',
};
let completeDatabase: null | QueryResult = null;

export function setCompleteDatabaseExport(data: QueryResult) {
    completeDatabase = data;
}

exportDataElement?.addEventListener('click', openExportDataPopup);

function openExportDataPopup() {
    const data = getQueryResult();
    openPopup(`
            <h2>Export Data</h2>
            <div class="flex-row">
                <vscode-radio-group id="export-which-data" orientation="vertical">
                    <label slot="label">Which Data</label>
                    <vscode-radio value="current" checked>Current (${data?.rows.length} rows, ${data?.fields.length} columns)</vscode-radio>
                    <vscode-radio value="complete">Complete Database ${data?.stats.rowCount ? '(' + data.stats.rowCount + ' rows)' : ''}</vscode-radio>
                </vscode-radio-group>
            </div>
            <vscode-divider></vscode-divider>
             <div class="flex-row">
                <vscode-dropdown id="export-data-format" class="mb-2">
                <vscode-option value="CSV">CSV</vscode-option>
                <vscode-option value="TXT">TXT</vscode-option>
                </vscode-dropdown>
                <p class="ml-3">Data format</p>
            </div>
             <div class="flex-row">
                <vscode-text-field size="4" type="text" id="export-separator"></vscode-text-field>
                <p class="ml-3">Separator</p>
            </div>
            <div class="flex-row">
                <vscode-checkbox id="export-add-row-header">Add row header</vscode-checkbox>
            </div>
            <div class="flex-row">
                <vscode-checkbox id="export-add-column-header">Add column header (row numbers)</vscode-checkbox>
            </div>
            <vscode-divider></vscode-divider>
            <p>Preview (${exportDataPreviewRowsCount} rows)</p>
             <div class="flex-row">
                <vscode-text-area id="export-preview" resize="none" readonly rows="${exportDataPreviewRowsCount + 1}"></vsode-text-area>
            </div>
            <vscode-divider></vscode-divider>

            <div class="flex-row">
                <div id="export-folder-path-icon"><i class="codicon codicon-folder"></i></div>
                <vscode-text-field class="ml-3 full-width" type="text" id="export-folder-path" disabled placeholder="Select folder"></vscode-text-field>
            </div>
            <vscode-divider></vscode-divider>
            <div class="flex-row">
                <vscode-button id="export-copy-to-clipboard" appearance="secondary">Copy to Clipboard</vscode-button>
                <vscode-button id="export-save-to-file" class="ml-3" disabled>Save to File</vscode-button>
            </div>
        `);
    requestAnimationFrame(() => {
        addExportDataEventListeners();
        updateExportDataPreview();
        (document.getElementById('export-separator') as HTMLInputElement).value = exportDataSeparator;
    });
}

function updateExportDataPreview() {
    const previewElement = document.getElementById('export-preview') as HTMLTextAreaElement;
    previewElement.value = createExportDataString(exportDataPreviewRowsCount);
}

export function updateExportDataFolderLocation(folderPath: string | null) {
    if (folderPath !== null) {
        const conn = getConnectionConfig();
        const format = (document.getElementById('export-data-format') as HTMLInputElement).value.toLowerCase();
        (document.getElementById('export-folder-path') as HTMLInputElement).value = folderPath + `/${conn?.connection.database}.${format}`;
        // @ts-ignore
        document.getElementById('export-save-to-file').disabled = false;
    }
}

function createExportDataString(rowCount: number) {
    const addRowHeader = (document.getElementById('export-add-row-header') as HTMLInputElement).checked;
    const addColumnHeader = (document.getElementById('export-add-column-header') as HTMLInputElement).checked;
    const exportDataFormat = (document.getElementById('export-data-format') as HTMLInputElement).value;
    const exportDataScope = (document.getElementById('export-which-data') as HTMLInputElement).value as ExportDataScope;
    let data = getQueryResult();
    if (!data) {
        return '';
    }
    if (exportDataScope === 'complete') {
        data = completeDatabase as QueryResult;
    }

    const maxRowCount = Math.min(rowCount, data.rows.length);
    if (exportDataFormat === 'CSV') {
        return exportDataFormatCSV(data, addRowHeader, addColumnHeader, maxRowCount);
    }
    else if (exportDataFormat === 'TXT') {
        return exportDataFormatTXT(data, addRowHeader, addColumnHeader, maxRowCount);
    }
    else {
        logWarn('exportDataPreview unknown format', exportDataFormat);
        return '';
    }
}

function addExportDataEventListeners() {
    document.getElementById('export-data-format')?.addEventListener('change', (e: any) => {
        exportDataSeparator = exportDataSeparatorDefaults[e.target.value as ExportDataFormat];
        (document.getElementById('export-separator') as HTMLInputElement).value = exportDataSeparator;
    });
    document.getElementById('export-separator')?.addEventListener('input', (e: any) => {
        exportDataSeparator = (document.getElementById('export-separator') as HTMLInputElement).value;
        updateExportDataPreview();
    });

    document.getElementById('export-folder-path-icon')?.addEventListener('click', (e) => {
        vscode.postMessage({
            command: 'export.chooseLocation',
        });
    });

    document.getElementById('export-copy-to-clipboard')?.addEventListener('click', () => {
        vscode.postMessage({
            command: 'copy.toClipboard',
            payload: createExportDataString(Number.MAX_SAFE_INTEGER)
        });
    });

    document.getElementById('export-save-to-file')?.addEventListener('click', () => {
        vscode.postMessage({
            command: 'export.save.toFile',
            payload: {
                data: createExportDataString(Number.MAX_SAFE_INTEGER),
                path: (document.getElementById('export-folder-path') as HTMLInputElement).value
            }
        });
    });

    document.getElementById('export-which-data')?.addEventListener('change', (e) => {
        const exportDataScope = (e.target as HTMLInputElement).value as ExportDataScope;
        if (exportDataScope === 'complete' && completeDatabase === null) {
            vscode.postMessage({
                command: 'export.load.completeDatabase',
            });
            setLoading(true);
        }
    });

    for (let i = 0; i < updatePreviewChangeListenerIds.length; i++) {
        document.getElementById(updatePreviewChangeListenerIds[i])?.addEventListener('change', updateExportDataPreview);
    }
}

function removeExportDataEventListeners() {
    for (let i = 0; i < updatePreviewChangeListenerIds.length; i++) {
        document.getElementById(updatePreviewChangeListenerIds[i])?.removeEventListener('change', updateExportDataPreview);
    }
}


function exportDataFormatCSV(data: QueryResult, addRowHeader: boolean, addColumnHeader: boolean, rowsCount: number) {
    let content = '';
    if (addRowHeader) {
        if (addColumnHeader) {
            content += 'row_number' + exportDataSeparator;
        }
        content += data.fields.map(field => field.name).join(exportDataSeparator) + '\n';
    }
    for (let i = 0; i < rowsCount; i++) {
        if (addColumnHeader) {
            content += `${i + 1}${exportDataSeparator}`;
        }
        content += data.fields.map(field => {
            const value = data.rows[i][field.name];
            if (value?.toString().includes(',')) {
                return `"${value}"`;
            }
            return value;
        }).join(exportDataSeparator) + '\n';
    }
    return content.trim();
}

function exportDataFormatTXT(data: QueryResult, addRowHeader: boolean, addColumnHeader: boolean, rowsCount: number) {
    let content = '';
    if (addRowHeader) {
        content += data.fields.map(field => field.name).join(exportDataSeparator) + '\n';
    }
    for (let i = 0; i < rowsCount; i++) {
        if (addColumnHeader) {
            content += `${i + 1}${exportDataSeparator}`;
        }
        content += data.fields.map(field => data.rows[i][field.name]).join(exportDataSeparator) + '\n';
    }
    return content.trim();
}
