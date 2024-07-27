import { Memento, type ExtensionContext } from "vscode"
let extensionStorage: ExtensionStorage | null = null

export function setExtensionStorage(newStorage: ExtensionStorage) {
    extensionStorage = newStorage
}

export function getExtensionStorage() {
    if (extensionStorage === null) {
        throw Error('Extension Storage not initialized.')
    }
    return extensionStorage
}

export class ExtensionStorage {
    constructor(private readonly globalState: Memento, private readonly workspaceState: Memento) { }

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