import { Disposable, Uri, ViewColumn, WebviewPanel, window } from "vscode"
import { getExtensionUri } from "../../../global"
import { getIconDarkLightPaths, getNonce, getUri } from "../common"
import { PoolConnectionConfig } from "../types"

export interface WebviewApp {
    id: string,
    title: string,
    webviewPath: string[],
    onWebviewMessage: (app: WebviewApp, e: WebviewAppMessage) => any,
    htmlBody?: string,
    iconPath?: ReturnType<typeof getIconDarkLightPaths>,
    disposables?: Disposable[],
    panel?: WebviewPanel,
    connectionConfig?: PoolConnectionConfig
    table?: string,
}

export type WebviewAppMessage = {
    command: string,
    payload: any,
}

const webviewApps: WebviewApp[] = []

export function renderWebviewApp(app: WebviewApp) {
    const extensionUri = getExtensionUri()
    const panel = window.createWebviewPanel(
        app.id,
        app.title,
        ViewColumn.One,
        {
            // Enable JavaScript in the webview
            enableScripts: true,
            // Restrict the webview to only load resources from the `dist`
            localResourceRoots: [
                Uri.joinPath(extensionUri, "dist"),
                Uri.joinPath(extensionUri, "dist", "codicons"),
            ],
        }
    )

    if (!app.disposables) {
        app.disposables = []
    }

    panel.onDidDispose(() => onDisposePanel(app), null, app.disposables)
    panel.iconPath = app.iconPath
    panel.webview.html = buildHtml(panel, app.webviewPath, app.htmlBody)
    panel.webview.onDidReceiveMessage((e: WebviewAppMessage) => app.onWebviewMessage(app, e))

    app.panel = panel
    webviewApps.push(app)
}

function onDisposePanel(app: WebviewApp) {
    app.panel?.dispose()
    if (app.disposables) {
        for (let i = 0; i < app.disposables.length; i++) {
            app.disposables[i].dispose()
        }
    }

    const index = webviewApps.findIndex(a => a.id === app.id)
    if (index !== -1) {
        webviewApps.splice(index, 1)
    }
}


function buildHtml(panel: WebviewPanel, webviewPath: string[], body?: string) {
    const styleUri = getUri(panel.webview, ["dist", "webviews", ...webviewPath, "webview", "style.css"])
    const globalStyleUri = getUri(panel.webview, ["dist", "webviews", "global.css"])
    const scriptUri = getUri(panel.webview, ["dist", "webviews", ...webviewPath, "webview", "index.js"])
    const codiconsUri = getUri(panel.webview, ['dist', 'codicons', 'codicon.css'])
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

export function getApp(id: string): WebviewApp | undefined {
    return webviewApps.find(app => app.id === id)
}
