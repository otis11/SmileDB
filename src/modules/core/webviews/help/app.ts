import { commands } from "vscode"
import { WebviewApp, WebviewAppMessage, getApp, renderWebviewApp } from ".."
import { getIconDarkLightPaths } from "../../common"

export function renderHelpApp() {
    const id = `stats`
    let app = getApp(id)
    if (app) {
        // close old edit connection panel
        app.panel?.dispose()
    }

    app = {
        id,
        title: "SmileDB Help",
        webviewPath: ['help'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths('help.svg'),
        htmlBody: getHtmlBody(),
    }

    renderWebviewApp(app)
}

async function onWebviewMessage(app: WebviewApp, message: WebviewAppMessage) {
    const { command, payload } = message

    if (command === "workbench.action.openSettings") {
        commands.executeCommand(command, payload)
    }
}

function getHtmlBody(): string {
    return /*html*/`
    <div class="table-of-contents">
        <h2>Hello! :)</h2>
        <vscode-divider></vscode-divider>
        <vscode-link href="#" id="go-to-settings">Open UI Settings</vscode-link>
        <vscode-link href="https://github.com/otis11/SmileDB/blob/main/docs/usage.md">Documentation [GitHub]</vscode-link>
    </div>
    `
}
