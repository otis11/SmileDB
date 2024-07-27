import * as vscode from 'vscode'
import { PoolConnectionConfig } from "./types"
import { makeStringUnique } from "./helper"
import {getExtensionStorage} from './extension-storage'

export function storePoolConnectionConfig(config: PoolConnectionConfig) {
    const storage = getExtensionStorage()
    const lastConnectionId = storage.get("lastConnectionId", true) as number || 1

    const connectionsWorkspace = storage.get("connections") as PoolConnectionConfig[] || []
    const connectionsGlobal = storage.get("connections", true) as PoolConnectionConfig[] || []
    const connections = [...connectionsWorkspace, ...connectionsGlobal]

    if (config.id === -1) {
        // connection is new
        config.id = lastConnectionId + 1
        // if name exists make unique
        const indexOfName = connections.findIndex(c => c.name === config.name)
        if (indexOfName !== -1) {
            config.name = makeStringUnique(config.name, connections.map(c => c.name))
        }
        connections.push(config)
        storage.store("lastConnectionId", config.id, true)
    } else {
        // connection already exists
        const indexOfConnection = connections.findIndex(c => c.id === config.id)
        connections[indexOfConnection] = config
    }

    storage.store("connections", connections.filter(c => c.advanced.global === false))
    storage.store("connections", connections.filter(c => c.advanced.global === true), true)
    return config.id
}

export function deletePoolConnectionConfig(config: PoolConnectionConfig) {
    const storage = getExtensionStorage()
    let connections = storage.get("connections", config.advanced.global) as PoolConnectionConfig[] || []
    connections = connections.filter(c => c.name !== config.name)
    storage.store("connections", connections, config.advanced.global)
}

export function resetPoolConnectionConfigs() {
    const storage = getExtensionStorage()
    storage.store("connections", [])
    storage.store("connections", [], true)
    storage.store("lastConnectionId", 0)
}

export function getPoolConnectionConfigs(useGlobal = false) {
    return getExtensionStorage().get("connections", useGlobal) as PoolConnectionConfig[] || []
}

export function getPoolConnectionConfigsAll() {
    return [
        ...getPoolConnectionConfigs(),
        ...getPoolConnectionConfigs(true)
    ]
}

export async function showQuickPickConnectionConfigs(): Promise<PoolConnectionConfig | undefined> {
    const connectionConfigs = getPoolConnectionConfigsAll()
    const selected = await vscode.window.showQuickPick(
        [
            ...connectionConfigs.map(c => ({
                label: c.name,
                description: c.advanced.global ? "Global" : "Workspace",
                id: c.id
            })),
        ],
        {
            "placeHolder": "Pick a connection config",
        }
    )

    return connectionConfigs.find(c => c.id === selected?.id)
}
