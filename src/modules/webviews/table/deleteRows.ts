import { addSelectedRowsToDeletion } from "./tableSelectionMode"

const deleteRowsElement = document.getElementById('delete-rows')

export function renderDeleteRows() {
    deleteRowsElement?.addEventListener('click', addSelectedRowsToDeletion)
}
