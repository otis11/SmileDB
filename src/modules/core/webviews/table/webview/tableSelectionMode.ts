import { copyToClipboard } from "../../webview-helper/copyToClipboard";
import { selectTextInContentEditableDiv } from "../../webview-helper/selectTextInContentEditableDiv";
import { exportDataSeparatorDefaults } from "./exportData";
import { updateOnPushChangesState } from "./push";
import { getQueryResultDeletions, setQueryResultDeletions } from "./query";
import { getTableElement } from "./table";

let isSelectionModeMouseDown = false;
let selectionModeTableOffsetTop = 0;
let selectionModeTableOffsetLeft = 40;
let isSelectionModeActive = true;
let colHeight = 26;
let colWidth = 180;
const selectionModeElement = document.getElementById('selection-mode') as HTMLElement;
const tableSelectionContextMenuDeleteRowsElement = document.getElementById('table-selection-context-menu-delete-rows') as HTMLElement;
const tableSelectionContextMenuDeleteRowsClearElement = document.getElementById('table-selection-context-menu-delete-rows-clear') as HTMLElement;
const tableSelectionContextMenuElement = document.getElementById('table-selection-context-menu') as HTMLElement;

export function addSelectionModeOverlayEventListeners(overlayElement: HTMLElement | null) {
    if (overlayElement) {
        overlayElement.addEventListener('mousedown', onSelectionModeMouseDown);
        overlayElement.addEventListener('mouseup', onSelectionModeMouseUp);
        overlayElement.addEventListener('mousemove', onSelectionModeMouseMove);
        overlayElement.addEventListener('contextmenu', onSelectionModeContextMenu);
        overlayElement.addEventListener('dblclick', onSelectionModeDoubleClick);
        selectionModeTableOffsetTop = getTableElement()?.offsetTop || 0;
    }
}

export function getIsSelectionModeActive() {
    return isSelectionModeActive;
}

export function renderSelectionMode() {
    selectionModeElement?.addEventListener('click', () => {
        toggleSelectionMode();
    });
    renderSelectionModeContextMenu();
}

export function toggleSelectionMode() {
    isSelectionModeActive = !isSelectionModeActive;
    updateSelectionMode();
}

export function setEditMode(mode: 'Edit' | 'Select') {
    if (mode === 'Edit') {
        isSelectionModeActive = false;
    } else {
        isSelectionModeActive = true;
    }
    updateSelectionMode();
}

export function updateSelectionMode() {
    if (!selectionModeElement) {
        return;
    };

    const selectionModeOverlayElement = document.getElementById('table-selection-mode-overlay') as HTMLElement;
    if (isSelectionModeActive) {
        selectionModeElement.innerHTML = '<i class="codicon codicon-edit"></i>';
        selectionModeOverlayElement?.classList.remove('d-none');
    } else {
        selectionModeElement.innerHTML = '<i class="codicon codicon-inspect"></i>';
        selectionModeOverlayElement?.classList.add('d-none');
        selectionModeClearSelectedCols();
    }
}

function onSelectionModeDoubleClick(e: any) {
    const { row, col } = getTargetRowColSelectionMode(e);

    const tableElement = getTableElement();
    const rowElement = tableElement?.children[row];

    const colElement = rowElement?.children[col + 1] as HTMLDivElement;

    colElement?.focus();
    selectTextInContentEditableDiv(colElement);
    selectionModeClearSelectedCols();
}

function onSelectionModeContextMenu(e: any) {
    e.preventDefault();

    if (tableSelectionContextMenuElement) {
        tableSelectionContextMenuElement.style.display = 'block';
        tableSelectionContextMenuElement.style.left = e.clientX + 'px';
        tableSelectionContextMenuElement.style.top = e.clientY + 'px';
    }
}

function onSelectionModeMouseDown(e: any) {
    // right click for context menu
    if (e.button === 2) {
        return;
    }
    isSelectionModeMouseDown = true;
    selectionModeClearSelectedCols();
}

function selectionModeClearSelectedCols() {
    const tableElement = getTableElement();
    const selectedCols = tableElement?.querySelectorAll('.col--selected');
    if (selectedCols) {
        for (let i = 0; i < selectedCols.length; i++) {
            selectedCols[i].classList.remove('col--selected');
        }
    }
}

function onSelectionModeMouseUp(e: any) {
    isSelectionModeMouseDown = false;

    const { row, col } = getTargetRowColSelectionMode(e);

    const tableElement = getTableElement();
    const rowElement = tableElement?.children[row];
    rowElement?.children[col + 1].classList.add('col--selected');
    rowElement?.firstElementChild?.classList.add('col--selected');
}

function onSelectionModeMouseMove(e: any) {
    if (!isSelectionModeMouseDown) {
        return;
    }

    const { row, col } = getTargetRowColSelectionMode(e);

    const tableElement = getTableElement();
    const rowElement = tableElement?.children[row];
    rowElement?.children[col + 1].classList.add('col--selected');
    rowElement?.firstElementChild?.classList.add('col--selected');
}

function getTargetRowColSelectionMode(e: any) {
    return {
        row: Math.floor((e.pageY - selectionModeTableOffsetTop) / colHeight),
        col: Math.floor((e.pageX - selectionModeTableOffsetLeft) / colWidth),
    };
}

export function addSelectedRowsToDeletion() {
    const tableElement = getTableElement();
    const rowSelectedNumberElements = tableElement?.querySelectorAll('.row:not(.row--add) .row-number.col--selected');
    const rows: number[] = [];
    if (rowSelectedNumberElements) {
        for (let i = 0; i < rowSelectedNumberElements?.length; i++) {
            const rowElement = rowSelectedNumberElements[i].parentElement;
            rowElement?.classList.add('row--delete');
            const rowNumberString = rowElement?.getAttribute('data-row');
            if (rowNumberString) {
                rows.push(parseInt(rowNumberString));
            }
        }
    }

    setQueryResultDeletions([...getQueryResultDeletions(), ...rows]);
    updateOnPushChangesState();
}

export function copySelectedColumns() {
    const tableElement = getTableElement();
    const selectedColumns = tableElement?.querySelectorAll('div.col--selected');
    if (selectedColumns === undefined) {
        return; // noting to copy
    }

    let content = '';
    for (let i = 0; i < selectedColumns.length; i++) {
        const col = selectedColumns[i];
        if (col.classList.contains('row-number')) {
            // remove extra separator at end of last column and add newline
            content = content.slice(0, -1) + '\n';
            continue;
        }
        let value = col.innerHTML;
        if (value.includes(',')) {
            value = `"${value}"`;
        }
        content += value + exportDataSeparatorDefaults['CSV'];
    }
    // remove last separator, maybe improve that separator only gets added at the correct locations
    copyToClipboard(content.slice(0, -1));
}

export function renderSelectionModeContextMenu() {
    const tableElement = getTableElement();
    tableSelectionContextMenuDeleteRowsElement?.addEventListener('click', addSelectedRowsToDeletion);

    tableSelectionContextMenuDeleteRowsClearElement?.addEventListener('click', (e) => {
        const rowSelectedNumberElements = tableElement?.querySelectorAll('.row-number.col--selected');
        const rows: number[] = [];
        if (rowSelectedNumberElements) {
            for (let i = 0; i < rowSelectedNumberElements?.length; i++) {
                const rowElement = rowSelectedNumberElements[i].parentElement;
                rowElement?.classList.remove('row--delete');
                const rowNumberString = rowElement?.getAttribute('data-row');
                if (rowNumberString) {
                    rows.push(parseInt(rowNumberString));
                }
            }
        }

        setQueryResultDeletions(getQueryResultDeletions().filter(rowNumber => !rows.includes(rowNumber)));
        updateOnPushChangesState();
    });

    window.addEventListener('click', (e) => {
        if (tableSelectionContextMenuElement) {
            tableSelectionContextMenuElement.style.display = 'none';
        }
    });
}
