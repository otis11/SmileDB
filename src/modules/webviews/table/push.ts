import { webviewGetConnectionConfig } from "../webview-internals"
import { getQueryResultChanges, getQueryResultDeletions, getQueryResultInsertions, requestExecuteQueries, requestExecuteQueriesPreview } from "./query"

const pushChangesElement = document.getElementById("push-changes")
const pushChangesPreviewElement = document.getElementById("push-changes-preview")
const pushChangesLoadingElement = document.getElementById("push-changes-loading")

export function updateOnPushChangesState() {
    if (Object.keys(getQueryResultChanges()).length > 0
        || getQueryResultDeletions().length > 0
        || Object.keys(getQueryResultInsertions()).length > 0) {
        pushChangesElement?.classList.remove("disabled")
        // update preview as well
        pushChangesPreviewElement?.classList.remove('disabled')
    } else {
        pushChangesElement?.classList.add("disabled")
        // update preview as well
        pushChangesPreviewElement?.classList.add('disabled')
    }
}

export function onPushChangesClick() {
    if (pushChangesElement?.classList.contains('disabled')) {
        return // nothing change
    }
    if (webviewGetConnectionConfig()?.advanced.readonly) {
        return // do nothing when readonly
    }
    updatePushChangesLoadingState(true)
    requestExecuteQueries()
}

export function renderPushChanges() {
    if (pushChangesElement) {
        pushChangesElement.onclick = onPushChangesClick
    }
    pushChangesPreviewElement?.addEventListener('click', onPushChangesPreviewClick)
}

function onPushChangesPreviewClick() {
    requestExecuteQueriesPreview()
}

export function updatePushChangesLoadingState(loading: boolean) {
    if (loading) {
        pushChangesLoadingElement?.classList.remove('d-none')
        pushChangesElement?.classList.add('d-none')
    } else {
        pushChangesLoadingElement?.classList.add('d-none')
        pushChangesElement?.classList.remove('d-none')
    }
}
