import { Uri, commands, window } from "vscode";
import { WebviewApp, WebviewAppMessage, getApp, renderWebviewApp } from "..";
import { PoolConnectionConfig } from "../../types";
import { ExtensionStorage, getActiveConnectionConfigs, getConnectionClientModule, getIconDarkLightPaths, logError, refreshPoolConnection, storePoolConnectionConfig } from "../../common";

export function renderActiveConnectionsApp(extensionUri: Uri, storage: ExtensionStorage) {
    const id = `stats`;
    let app = getApp(id);
    if (app) {
        // close old edit connection panel
        app.panel?.dispose();
    }

    app = {
        id,
        title: "SmileDB Active Connections",
        webviewPath: ['active-connections'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths(extensionUri, 'layers-active.svg'),
        htmlBody: getHtmlBody(),
        storage,
    };

    renderWebviewApp(extensionUri, app);
}

async function onWebviewMessage(app: WebviewApp, message: WebviewAppMessage) {
    const { command, payload } = message;


    if (command === "load.activeConnections") {
        app.panel?.webview.postMessage({
            command: `load.activeConnections`,
            payload: {
                activeConnections: getActiveConnectionConfigs()
            }
        });
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
    `;
}
