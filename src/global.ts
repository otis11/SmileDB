import { Memento, type ExtensionContext } from "vscode"
let context: ExtensionContext | null = null
let storage: ExtensionStorage | null = null

export function getContext() {
    if (context === null) {
        throw Error('Extension Context not initialized.')
    }
    return context
}

export function getExtensionUri() {
    return getContext().extensionUri
}

export function getStorage() {
    if (storage === null) {
        throw Error('Extension Storage not initialized.')
    }
    return storage
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

export function initializeGlobals(c: ExtensionContext) {
    context = c
    storage = new ExtensionStorage(
        context.globalState,
        context.workspaceState
    )
}