import { commands } from "vscode";
import { PoolConnection, PoolConnectionConfig } from "../types";
import { logDebug } from "./logger";
import { getConnectionClientModule } from "./module";

type ActiveDatabaseConnection = {
    closeTimeout: ReturnType<typeof setTimeout>,
    poolConnection: PoolConnection,
    closeTimeoutDate: Date,
};

// id.schema.database
const poolConnectionsActive: { [key: string]: ActiveDatabaseConnection } = {};

export function getPoolConnection(connectionConfig: PoolConnectionConfig) {
    if (connectionConfig.id === -1) {
        return createPoolConnection(connectionConfig);
    }

    const connection = poolConnectionsActive[identifier(connectionConfig)];
    if (!connection) {
        const newConnection = createPoolConnection(connectionConfig);
        commands.executeCommand('SmileDB.refreshConnectionsSilent');
        return newConnection;
    }

    logDebug('DatabaseConnection already in use. Returning', connection);
    clearTimeout(connection.closeTimeout);
    connection.closeTimeout = setTimeout(() => closePoolConnection(connection), connectionConfig.advanced.stayAliveInSeconds * 1000);
    connection.closeTimeoutDate = new Date();
    return connection.poolConnection;
}

export function isPoolConnectionConfigActive(connectionConfig: PoolConnectionConfig) {
    return poolConnectionsActive[identifier(connectionConfig)];
}

export async function refreshPoolConnection(config: PoolConnectionConfig) {
    const connection = poolConnectionsActive[identifier(config)];
    await closePoolConnection(connection);
    return getPoolConnection(config);
}

function createPoolConnection(config: PoolConnectionConfig) {
    const connection: ActiveDatabaseConnection = {
        poolConnection: getConnectionClientModule(config.moduleName).createPoolConnection(config),
        closeTimeout: setTimeout(() => closePoolConnection(connection), config.advanced.stayAliveInSeconds * 1000),
        closeTimeoutDate: new Date(),
    };
    poolConnectionsActive[identifier(config)] = connection;
    return connection.poolConnection;
}

async function closePoolConnection(connection: ActiveDatabaseConnection | undefined) {
    if (connection) {
        const config = connection.poolConnection.config;
        logDebug('DatabaseConnection close: timeout keep alive reached.', connection);
        await connection.poolConnection.closeConnection();
        delete poolConnectionsActive[identifier(config)];
        commands.executeCommand('SmileDB.refreshConnectionsSilent');
    }
}

function identifier(config: PoolConnectionConfig) {
    return `${config.id}.${config.connection.schema}.${config.connection.database}`;
}

export function getActiveConnectionConfigs() {
    return Object.keys(poolConnectionsActive).map(key => ({
        ...poolConnectionsActive[key].poolConnection.config,
        secondsUntilClose: poolConnectionsActive[key].poolConnection.config.advanced.stayAliveInSeconds - Math.floor((new Date().getTime() - poolConnectionsActive[key].closeTimeoutDate.getTime()) / 1000)
    }));
}
