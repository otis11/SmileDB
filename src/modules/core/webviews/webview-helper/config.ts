import { vscode } from "./vscode"

type ConfigLoadCallback = (config: any) => void
let config: any = null
const onConfigLoadCallbacks: ConfigLoadCallback[] = []

export function getConfig() {
    return config
}

export function setConfig(cfg: any) {
    config = cfg
}

export function onConfigLoad(callback: ConfigLoadCallback) {
    onConfigLoadCallbacks.push(callback)
}

vscode.postMessage({
    command: 'load.config'
})

window.addEventListener('message', event => {
    const message = event.data
    if (message.command === "load.config") {
        config = message.payload
        if (!config) {
            return
        }

        for (let i = 0; i < onConfigLoadCallbacks.length; i++) {
            onConfigLoadCallbacks[i](config)
        }
    }
})
