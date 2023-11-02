import { makeStringUnique } from "./helper";
import { PoolConnectionConfig } from "../types";
import { ExtensionStorage } from "./storage";
import * as vscode from 'vscode';

export function storePoolConnectionConfig(config: PoolConnectionConfig, storage: ExtensionStorage) {
    const lastConnectionId = storage.get("lastConnectionId", true) as number || 1;

    const connectionsWorkspace = storage.get("connections") as PoolConnectionConfig[] || [];
    const connectionsGlobal = storage.get("connections", true) as PoolConnectionConfig[] || [];
    const connections = [...connectionsWorkspace, ...connectionsGlobal];

    if (config.id === -1) {
        // connection is new
        config.id = lastConnectionId + 1;
        // if name exists make unique
        let indexOfName = connections.findIndex(c => c.name === config.name);
        if (indexOfName !== -1) {
            config.name = makeStringUnique(config.name, connections.map(c => c.name));
        }
        connections.push(config);
        storage.store("lastConnectionId", config.id, true);
    } else {
        // connection already exists
        const indexOfConnection = connections.findIndex(c => c.id === config.id);
        connections[indexOfConnection] = config;
    }

    storage.store("connections", connections.filter(c => c.advanced.global === false));
    storage.store("connections", connections.filter(c => c.advanced.global === true), true);
    return config.id;
}

export function deletePoolConnectionConfig(config: PoolConnectionConfig, storage: ExtensionStorage) {
    let connections = storage.get("connections", config.advanced.global) as PoolConnectionConfig[] || [];
    connections = connections.filter(c => c.name !== config.name);
    storage.store("connections", connections, config.advanced.global);
}

export function resetPoolConnectionConfigs(storage: ExtensionStorage) {
    storage.store("connections", []);
    storage.store("connections", [], true);
    storage.store("lastConnectionId", 0);
}

export function getPoolConnectionConfigs(storage: ExtensionStorage, useGlobal: boolean = false) {
    return storage.get("connections", useGlobal) as PoolConnectionConfig[] || [];
}

export function getPoolConnectionConfigsAll(storage: ExtensionStorage) {
    return [
        ...getPoolConnectionConfigs(storage),
        ...getPoolConnectionConfigs(storage, true)
    ];
}

export async function showQuickPickConnectionConfigs(storage: ExtensionStorage): Promise<PoolConnectionConfig | undefined> {
    const connectionConfigs = getPoolConnectionConfigsAll(storage);
    let selected = await vscode.window.showQuickPick(
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
    );

    return connectionConfigs.find(c => c.id === selected?.id);
}
