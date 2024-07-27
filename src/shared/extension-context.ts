import { ExtensionContext } from "vscode"

let extensionContext: ExtensionContext | null = null

export function setExtensionContext(newContext: ExtensionContext) {
    extensionContext = newContext
}

export function getExtensionContext() {
    if (extensionContext === null) {
        throw Error('Extension Context not initialized.')
    }
    return extensionContext
}