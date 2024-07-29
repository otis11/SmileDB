import { provideVSCodeDesignSystem, vsCodeCheckbox, vsCodeDivider, vsCodeProgressRing, vsCodeTextField } from "@vscode/webview-ui-toolkit"
import { PoolConnectionConfig } from "../../../shared/types"
import { webviewVscode } from "../webview-internals"
import "./index.css"

const connectionsContainer = document.getElementById('connections') as HTMLDivElement
const loadingElement = document.getElementById('loading') as HTMLDivElement
const searchElement = document.getElementById('search') as HTMLInputElement
const resultsElement = document.getElementById('results') as HTMLDivElement
const statsTablesElement = document.getElementById('stats-tables') as HTMLDivElement
let selectedConnectionConfigNames: string[] = []
let connectionConfigs: PoolConnectionConfig[] = []

provideVSCodeDesignSystem().register(
    vsCodeDivider(),
    vsCodeTextField(),
    vsCodeCheckbox(),
    vsCodeProgressRing(),
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
        <div class="row" data-name="${p.name}" data-type="${p.type}" data-database="${p.database}" data-connection="${p.connection}">
            <div class="row-title">${p.name}</div>
            <div class="row-info">
                <div class="row-text">${p.database}</div>
                <div class="row-text">${p.connection}</div>
                <div class="row-text">${p.type}</div>
            </div>
        </div>
        `).join('')
        statsTablesElement.innerHTML = `${message.payload.filter(x => x.type === 'table').length} tables`
    }
})

webviewVscode.postMessage({
    command: 'load.connections',
})

function renderConnections(connections: PoolConnectionConfig[]) {
    console.log(connections)
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
    webviewVscode.postMessage({
        command: 'load.data',
        payload: {
            connectionConfigs: connectionConfigs.filter(c => selectedConnectionConfigNames.includes(c.name))
        }
    })
})

searchElement.addEventListener('input', () => {
    applyClientSearch()
})

resultsElement.addEventListener('click', (e) => {
    const row = e.target as HTMLDivElement
    const connection = row.getAttribute('data-connection')
    const type = row.getAttribute('data-type')
    const name = row.getAttribute('data-name')
    const database = row.getAttribute('data-database')

    webviewVscode.postMessage({
        command: 'open',
        payload: {
            connection,
            type,
            name,
            database,
        }
    })
})

function applyClientSearch() {
    const search = searchElement.value
    // emtpy search? show all children
    if (search.trim() === '') {
        Array.from(resultsElement.children).forEach((child) => {
            child.classList.remove('d-none')
        })
        return
    }

    Array.from(resultsElement.children).forEach((child) => {
        const text = child.textContent
        if (includesAllWords(search, text)) {
            child.classList.remove('d-none')
        } else {
            child.classList.add('d-none')
        }
    })
}

function includesAllWords(search, text) {
    const searchWords = search.toLowerCase().split(/[ \n]/gmi)
    let includesAllWords = true
    searchWords.forEach((word) => {
        if (!text.toLowerCase().includes(word)) {
            includesAllWords = false
        }
    })
    return includesAllWords
}