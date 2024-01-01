import * as vscode from 'vscode';

/**
 * A helper function that returns a unique alphanumeric identifier called a nonce.
 *
 * @remarks This function is primarily used to help enforce content security
 * policies for resources/scripts being executed in a webview context.
 *
 * @returns A nonce
 */
export function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

import { ExtensionContext, Uri, Webview } from "vscode";
import { config } from '../../../config';

/**
 * A helper function which will get the webview URI of a given file or resource.
 *
 * @remarks This URI can be used within a webview's HTML as a link to the
 * given file/resource.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param pathList An array of strings representing the path to a file/resource
 * @returns A URI pointing to the file/resource
 */
export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

export function makeStringUnique(name: string, names: string[]) {
    // TODO improve
    const number = ((parseInt(name.slice(-1)) || 0) + 1);
    if (number === 1) {
        name = name + " " + 1;
    } else {
        name = name.slice(0, name.length - 1) + number;
    }

    if (names.includes(name)) {
        name = makeStringUnique(name, names);
    }

    return name;
}

export function registerCommand(name: string, context: ExtensionContext, callback: (...args: any[]) => any) {
    context.subscriptions.push(vscode.commands.registerCommand(name, callback));
}

export function getIconDarkLightPaths(extensionUri: vscode.Uri, icon: string) {
    return {
        light: vscode.Uri.joinPath(extensionUri, 'resources', 'light', icon),
        dark: vscode.Uri.joinPath(extensionUri, 'resources', 'dark', icon)
    };
}

export async function showMessage(message: string, timeout: number = 2000) {
    if (config.general.messageDisplay === 'Information Message') {
        await showInformationMessage(message, timeout);
    }
    if (config.general.messageDisplay === 'Status Bar') {
        await showStatusBarMessage(message, timeout);
    }
}

async function showStatusBarMessage(message: string, timeout: number = 2000) {
    const statusBarItem = vscode.window.setStatusBarMessage(message);
    setTimeout(() => {
        statusBarItem.dispose();
    }, timeout);
}

async function showInformationMessage(message: string, timeout: number = 2000) {
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: message,
            cancellable: false,
        },
        async (progress: any): Promise<void> => {
            await new Promise(resolve => setTimeout(resolve, timeout));
            progress.report({ increment: 100 });
        },
    );
}

export function copyToClipboard(str: string) {
    vscode.env.clipboard.writeText(str);
}

export function jsonStringify(value: any) {
    return typeof value === 'object' ? JSON.stringify(value) : value;
}
