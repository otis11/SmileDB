import { provideVSCodeDesignSystem, vsCodeDivider } from "@vscode/webview-ui-toolkit"
import { webviewHtmlSanitize, webviewVscode } from "../webview-internals"
import './index.css'

provideVSCodeDesignSystem().register(
    vsCodeDivider(),
)

const activeConnectionsCounterElement = document.getElementById('active-connections-counter') as HTMLSpanElement
const activeConnectionsContainerElement = document.getElementById('active-connections-container') as HTMLSpanElement
const reloadElement = document.getElementById('reload') as HTMLSpanElement

reloadElement.addEventListener('click', () => {
    webviewVscode.postMessage({
        command: 'load.activeConnections'
    })
})

window.addEventListener('message', event => {
    const message = event.data

    if (message.command === "load.activeConnections") {
        const activeConnections = message.payload.activeConnections
        const activeConnectionsCounter = activeConnections.length
        activeConnectionsCounterElement.innerText = message.payload.activeConnections.length.toString()
        if (activeConnectionsCounter > 0) {
            activeConnectionsCounterElement.classList.add('success')
            activeConnectionsCounterElement.classList.remove('error')
        } else {
            activeConnectionsCounterElement.classList.remove('success')
            activeConnectionsCounterElement.classList.add('error')
        }

        // render all active connections
        const tableHeader = document.createElement('div')
        tableHeader.classList.add('table-header')
        tableHeader.innerHTML = `
        <div>name</div>
        <div>database</div>
        <div>schema</div>
        <div>Seconds until close</div>
        `
        activeConnectionsContainerElement.innerHTML = tableHeader.outerHTML
        // sort after connection name
        activeConnections.sort((a: any, b: any) => {
            if (a.id > b.id) {
                return 1
            }
            if (a.id < b.id) {
                return -1
            }
            return 0
        })
        let lastConnectionId = null
        for (let i = 0; i < activeConnections.length; i++) {
            const connection = activeConnections[i]

            if (lastConnectionId !== connection.id) {
                // add empty row
                const child = document.createElement('div')
                child.classList.add('active-connection-empty')
                activeConnectionsContainerElement.appendChild(child)
            }
            const child = document.createElement('div')
            child.classList.add('active-connection')
            child.innerHTML = `
                <div class="connection-name">${webviewHtmlSanitize(connection.name)}</div>
                <div class="connection-database">${webviewHtmlSanitize(connection.connection.database)}</div>
                <div class="connection-schema">${webviewHtmlSanitize(connection.connection.schema || '-')}</div>
                <div class="connection-seconds-until-close">${webviewHtmlSanitize(connection.secondsUntilClose || 0)}</div>
            `
            activeConnectionsContainerElement.appendChild(child)
            lastConnectionId = connection.id
        }
    }
})

webviewVscode.postMessage({
    command: 'load.activeConnections'
})

