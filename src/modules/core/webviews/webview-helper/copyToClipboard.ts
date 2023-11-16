import { vscode } from "./vscode";

export function copyToClipboard(content: string) {
    vscode.postMessage({
        command: 'copy.toClipboard',
        payload: content
    });
}
