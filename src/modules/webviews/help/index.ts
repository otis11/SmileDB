import { provideVSCodeDesignSystem, vsCodeDivider, vsCodeLink } from "@vscode/webview-ui-toolkit"
import { webviewVscode } from "../webview-internals"
import "./index.css"

provideVSCodeDesignSystem().register(
    vsCodeDivider(),
    vsCodeLink()
)

document.getElementById('go-to-settings')?.addEventListener('click', () => {
    webviewVscode.postMessage({
        command: 'workbench.action.openSettings',
        payload: 'SmileDB'
    })
})
