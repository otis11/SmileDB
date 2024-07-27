import { Uri, ViewColumn, WebviewPanel, window } from "vscode"
import { WebviewConfig, WebviewMessage } from "../../shared/types"
import { getExtensionUri, getNonce, getWebviewUri } from "../../shared/helper"

const webviewConfigs: WebviewConfig[] = []

export function openWebviewConfig(webviewConfig: WebviewConfig) {
    const activeWebviewConfig = getActiveWebviewConfig(webviewConfig.id)
    if (activeWebviewConfig) {
        activeWebviewConfig.panel?.reveal()
        return
    }

    const extensionUri = getExtensionUri()
    const panel = window.createWebviewPanel(
        webviewConfig.id,
        webviewConfig.title,
        ViewColumn.One,
        {
            retainContextWhenHidden: webviewConfig.retainContextWhenHidden,
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the `dist`
            localResourceRoots: [
                Uri.joinPath(extensionUri, "dist"),
                Uri.joinPath(extensionUri, "dist", "codicons"),
            ],
        }
    )

    if (!webviewConfig.disposables) {
        webviewConfig.disposables = []
    }

    panel.onDidDispose(() => onDisposePanel(webviewConfig), null, webviewConfig.disposables)
    panel.iconPath = webviewConfig.iconPath
    panel.webview.html = buildHtml(panel, webviewConfig.webviewPath, webviewConfig.htmlBody)
    panel.webview.onDidReceiveMessage((e: WebviewMessage) => webviewConfig.onWebviewMessage(webviewConfig, e))

    webviewConfig.panel = panel
    webviewConfigs.push(webviewConfig)
}

function onDisposePanel(webviewConfig: WebviewConfig) {
    webviewConfig.panel?.dispose()
    if (webviewConfig.disposables) {
        for (let i = 0; i < webviewConfig.disposables.length; i++) {
            webviewConfig.disposables[i].dispose()
        }
    }

    const index = webviewConfigs.findIndex(a => a.id === webviewConfig.id)
    if (index !== -1) {
        webviewConfigs.splice(index, 1)
    }
}


function buildHtml(panel: WebviewPanel, webviewPath: string[], body?: string) {
    const styleUri = getWebviewUri(panel.webview, ["dist", "webviews", ...webviewPath, "index.css"])
    const globalStyleUri = getWebviewUri(panel.webview, ["dist", "webviews", "webview-global.css"])
    const scriptUri = getWebviewUri(panel.webview, ["dist", "webviews", ...webviewPath, "index.js"])
    const codiconsUri = getWebviewUri(panel.webview, ['dist', 'codicons', 'codicon.css'])
    const nonce = getNonce()

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
        <head>
        <title></title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${panel.webview.cspSource}; style-src ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
        <script src="${scriptUri}" nonce="${nonce}" type="module" defer></script>
        <link rel="stylesheet" href="${globalStyleUri}">
        <link rel="stylesheet" href="${styleUri}">
        <link rel="stylesheet" href="${codiconsUri}">
        </head>
        <body>
            ${body || ''}
        </body>
    </html>
    `
}

export function getActiveWebviewConfig(id: string): WebviewConfig | undefined {
    return webviewConfigs.find(webviewConfig => webviewConfig.id === id)
}
