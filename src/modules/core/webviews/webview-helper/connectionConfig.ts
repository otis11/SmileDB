import { PoolConnectionConfig } from "../../types";
import { vscode } from "./vscode";

type ConnectionConfigLoadCallback = (config: PoolConnectionConfig) => void;
let connectionConfig: PoolConnectionConfig | null = null;
let onConnectionConfigLoadCallbacks: ConnectionConfigLoadCallback[] = [];

export function getConnectionConfig() {
    return connectionConfig;
}

export function setConnectionConfig(config: PoolConnectionConfig | null) {
    connectionConfig = config;
}

export function onConnectionConfigLoad(callback: ConnectionConfigLoadCallback) {
    onConnectionConfigLoadCallbacks.push(callback);
}

vscode.postMessage({
    command: 'load.connectionConfig'
});

window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === "load.connectionConfig") {
        connectionConfig = message.payload;
        if (!connectionConfig) {
            return;
        }

        for (let i = 0; i < onConnectionConfigLoadCallbacks.length; i++) {
            onConnectionConfigLoadCallbacks[i](connectionConfig);
        }
    }
});
