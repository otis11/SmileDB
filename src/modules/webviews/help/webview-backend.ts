import { commands } from "vscode"
import { getIconDarkLightPaths } from "../../../shared/helper"
import { openWebviewConfig } from "../webview"
import { WebviewConfig, WebviewMessage } from "../../../shared/types"

export function openHelpWebview() {
    openWebviewConfig({
        id: 'help',
        title: "SmileDB Help",
        webviewPath: ['help'],
        onWebviewMessage,
        iconPath: getIconDarkLightPaths('help.svg'),
        htmlBody: getHtmlBody(),
    })
}

async function onWebviewMessage(webviewConfig: WebviewConfig, message: WebviewMessage) {
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
