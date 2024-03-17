import { provideVSCodeDesignSystem, vsCodeCheckbox, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeDivider, vsCodeProgressRing, vsCodeTextField } from "@vscode/webview-ui-toolkit"
import { PoolConnectionConfig } from "../../../types"
import { vscode } from "../../webview-helper/vscode"

const connectionsContainer = document.getElementById('connections') as HTMLDivElement
const loadingElement = document.getElementById('loading') as HTMLDivElement
const searchElement = document.getElementById('search') as HTMLDivElement
const resultsElement = document.getElementById('results') as HTMLDivElement
let selectedConnectionConfigNames: string[] = []
let connectionConfigs: PoolConnectionConfig[] = []

provideVSCodeDesignSystem().register(
    vsCodeDivider(),
    vsCodeTextField(),
    vsCodeCheckbox(),
    vsCodeProgressRing(),
    vsCodeDataGrid(),
    vsCodeDataGridCell(),
    vsCodeDataGridRow()
)

window.addEventListener('message', event => {
    const message = event.data
    if (message.command === 'load.connections.result') {
        connectionConfigs = message.payload
        renderConnections(message.payload)
    }
    if (message.command === 'load.data.result') {
        loadingElement.classList.add('d-none')
        resultsElement.innerHTML = message.payload.map(p => `
        <vscode-data-grid-row>
            <vscode-data-grid-cell>${p.name}</vscode-data-cell>
            <vscode-data-grid-cell>${p.database}</vscode-data-cell>
            <vscode-data-grid-cell>${p.connection}</vscode-data-cell>
            <vscode-data-grid-cell>${p.type}</vscode-data-cell>
        </vscode-data-grid-row>
        `).join('')
    }
})

vscode.postMessage({
    command: 'load.connections',
})

function renderConnections(connections: PoolConnectionConfig[]) {
    connectionsContainer.innerHTML = connections.map(c => `<vscode-checkbox value="${c.name}">${c.name}</vscode-checkbox>`).join('')
}

connectionsContainer.addEventListener('change', (e) => {
    const checkbox = e.target as HTMLInputElement
    if (checkbox.checked) {
        selectedConnectionConfigNames.push(checkbox.value)
    } else {
        selectedConnectionConfigNames = selectedConnectionConfigNames.filter(name => name !== checkbox.value)
    }

    loadingElement.classList.remove('d-none')
    vscode.postMessage({
        command: 'load.data',
        payload: {
            connectionConfigs: connectionConfigs.filter(c => selectedConnectionConfigNames.includes(c.name))
        }
    })
})