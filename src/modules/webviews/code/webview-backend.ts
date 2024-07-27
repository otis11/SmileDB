import { getIconDarkLightPaths } from "../../../shared/helper"
import { WebviewConfig, WebviewMessage } from "../../../shared/types"
import { openWebviewConfig } from "../webview"

export function openCodeWebview(config: { title: string, code: string }) {
    openWebviewConfig({
        id: 'code',
        title: config.title,
        webviewPath: ['code'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths('layers-active.svg'),
        htmlBody: getHtmlBody(config),
    })
}

async function onWebviewMessage(app: WebviewConfig, message: WebviewMessage) {
    const { command, payload } = message
}

function getHtmlBody(config: { title: string, code: string }): string {
    return /*html*/`
    <h2>${config.title}</h2>
    <vscode-divider></vscode-divider>
    <pre><code id="code" class="hljs language-sql">${config.code}</code></pre>
    `
}
