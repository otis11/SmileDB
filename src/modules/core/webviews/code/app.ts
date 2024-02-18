import { WebviewApp, WebviewAppMessage, getApp, renderWebviewApp } from ".."
import { getIconDarkLightPaths } from "../../common"

export function renderCodeApp(config: { title: string, code: string }) {
    const id = `stats`
    let app = getApp(id)
    if (app) {
        // close old edit connection panel
        app.panel?.dispose()
    }

    app = {
        id,
        title: config.title,
        webviewPath: ['code'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths('layers-active.svg'),
        htmlBody: getHtmlBody(config),
    }

    renderWebviewApp(app)
}

async function onWebviewMessage(app: WebviewApp, message: WebviewAppMessage) {
    const { command, payload } = message
}

function getHtmlBody(config: { title: string, code: string }): string {
    return /*html*/`
    <h2>${config.title}</h2>
    <vscode-divider></vscode-divider>
    <pre><code id="code" class="hljs language-sql">${config.code}</code></pre>
    `
}
