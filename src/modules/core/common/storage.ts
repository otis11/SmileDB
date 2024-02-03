import * as vscode from 'vscode'
export class ExtensionStorage {
    constructor(private readonly globalState: vscode.Memento, private readonly workspaceState: vscode.Memento) { }

    store(key: string, value: any, useGlobalState = false): void {
        this.getState(useGlobalState).update(key, value)
    }

    get(key: string, useGlobalState = false): any {
        return this.getState(useGlobalState).get(key)
    }

    private getState(useGlobal: boolean) {
        if (useGlobal) {
            return this.globalState
        }
        return this.workspaceState
    }
}
