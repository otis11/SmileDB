import { getActiveConnectionConfigs } from "../../../shared/database-connections"
import { getIconDarkLightPaths } from "../../../shared/helper"
import { WebviewConfig, WebviewMessage } from "../../../shared/types"
import { openWebviewConfig } from "../webview"

export function openActiveConnectionsWebview() {
    openWebviewConfig({
        id: 'active-connections',
        title: "SmileDB Active Connections",
        webviewPath: ['active-connections'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths('layers-active.svg'),
        htmlBody: getHtmlBody(),
    })
}

async function onWebviewMessage(app: WebviewConfig, message: WebviewMessage) {
    const { command, payload } = message


    if (command === "load.activeConnections") {
        app.panel?.webview.postMessage({
            command: `load.activeConnections`,
            payload: {
                activeConnections: getActiveConnectionConfigs()
            }
        })
    }
}

function getHtmlBody(): string {
    return /*html*/`
    <nav>
        <i class="codicon codicon-refresh" id="reload"></i>
        <div class="active-connections">Active Connections:
            <span id="active-connections-counter"></span>
        </div>
    </nav>
    <vscode-divider></vscode-divider>
    <div id="active-connections-container">

    </div>
    `
}
