import { LogLevel, PoolConnectionConfig, ShortcutRegister } from "../../shared//types"

type ExtensionConfigLoadCallback = (config: any) => void
type ConnectionConfigLoadCallback = (config: PoolConnectionConfig) => void

// @ts-expect-error acquireVsCodeApi is not in typescript global types but is available inside each webview
export const webviewVscode = acquireVsCodeApi()

let extensionConfig: any = null
const onExtensionConfigLoadCallbacks: ExtensionConfigLoadCallback[] = []

let connectionConfig: PoolConnectionConfig | null = null
const onConnectionConfigLoadCallbacks: ConnectionConfigLoadCallback[] = []

export function webviewHtmlSanitize(value?: string) {
    if (typeof value !== 'string') return value
    return value?.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function webviewSelectTextInContentEditableDiv(element: HTMLDivElement) {
    const range = document.createRange()
    range.selectNodeContents(element)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
}

export function webviewRegisterShortcuts(shortcutRegisters: ShortcutRegister[]) {
    const pressedKeys: { [key: string]: boolean } = {}
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        pressedKeys[e.key] = true
        const shortcutRegister = shortcutRegisters.find(register => {
            return Object.keys(register.keys).filter(key => !pressedKeys[key]).length === 0
        })
        if (shortcutRegister) {
            shortcutRegister.callback()
        }
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {
        pressedKeys[e.key] = false
    })
}

export function webviewCreateElementFromHTMLString(htmlString: string) {
    const div = document.createElement('div')
    div.innerHTML = htmlString.trim()
    return div.firstElementChild as HTMLElement
}

export function webviewCopyToClipboard(content: string) {
    webviewVscode.postMessage({
        command: 'copy.toClipboard',
        payload: content
    })
}

export function webviewCreateCodiconElement(icon: string, small?: boolean) {
    const iconContainer = document.createElement("div")
    if (small) {
        iconContainer.classList.add("icon-small")
    }
    const iconElement = document.createElement("i")
    iconElement.classList.add("codicon", "codicon-" + icon)
    iconContainer.appendChild(iconElement)
    return iconContainer
}

export function webviewGetConnectionConfig() {
    return connectionConfig
}

export function webviewSetConnectionConfig(config: PoolConnectionConfig | null) {
    connectionConfig = config
}

export function webviewOnConnectionConfigLoad(callback: ConnectionConfigLoadCallback) {
    onConnectionConfigLoadCallbacks.push(callback)
}

export function webviewGetExtensionConfig() {
    return extensionConfig
}

export function webviewSetExtensionConfig(cfg: any) {
    extensionConfig = cfg
}

export function webviewOnExtensionConfigLoad(callback: ExtensionConfigLoadCallback) {
    onExtensionConfigLoadCallbacks.push(callback)
}

let logLevel: LogLevel = LogLevel.debug

export function webviewSetLogLevel(level: LogLevel) {
    logLevel = level
}

function log(logLevel: LogLevel, ...args: any[]) {
    if (logLevel >= logLevel) {
        console.log(
            getLogLevelColor(logLevel) + LogLevel[logLevel].toUpperCase() + ' \x1b[0m',
            ...args
        )
    }
}

function getLogLevelColor(logLevel: LogLevel) {
    if (logLevel === LogLevel.info) {
        // blue
        return '\x1b[34m '
    }
    if (logLevel === LogLevel.warn) {
        // yellow
        return '\x1b[33m '
    }
    if (logLevel === LogLevel.error) {
        // red
        return '\x1b[31m '
    }
    // gray, debug
    return '\x1b[90m'
}

export function webviewLogDebug(...args: any[]) {
    log(LogLevel.debug, ...args)
}

export function webviewLogInfo(...args: any[]) {
    log(LogLevel.info, ...args)
}

export function webviewLogWarn(...args: any[]) {
    log(LogLevel.warn, ...args)
}

export function webviewLogError(...args: any[]) {
    log(LogLevel.error, ...args)
}

webviewVscode.postMessage({
    command: 'load.extensionConfig'
})
webviewVscode.postMessage({
    command: 'load.connectionConfig'
})

window.addEventListener('message', event => {
    const message = event.data
    if (message.command === "load.connectionConfig") {
        connectionConfig = message.payload
        if (!connectionConfig) {
            return
        }

        for (let i = 0; i < onConnectionConfigLoadCallbacks.length; i++) {
            onConnectionConfigLoadCallbacks[i](connectionConfig)
        }
    }
    else if (message.command === "load.extensionConfig") {
        extensionConfig = message.payload
        if (!extensionConfig) {
            return
        }

        webviewSetLogLevel(extensionConfig.general.logLevel)

        for (let i = 0; i < onExtensionConfigLoadCallbacks.length; i++) {
            onExtensionConfigLoadCallbacks[i](extensionConfig)
        }
    }
})



