import { TreeItem, Uri } from "vscode";
import { DatabaseTreeItem, PoolConnectionTreeItem, SchemaTreeItem, TableTreeItem, getPoolConnection } from "../core";
import { PostgreSQLPoolConnection } from "./PostgreSQLPoolConnection";

export async function getDatabaseTreeChildren(extensionUri: Uri, item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection;
        const { rows, fields } = await connection.fetchDatabases();
        return rows.map(row => new DatabaseTreeItem(
            extensionUri,
            {
                ...item.connectionConfig,
                connection: {
                    ...item.connectionConfig.connection,
                    database: row[fields[0].name]?.toString() || '',
                }
            },

        ));
    }

    else if (item instanceof DatabaseTreeItem) {
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection;
        const { rows, fields } = await connection.fetchSchemas();
        return rows.map(row => new SchemaTreeItem(
            extensionUri,
            {
                ...item.connectionConfig,
                connection: {
                    ...item.connectionConfig.connection,
                    schema: row[fields[0].name]?.toString() || '',
                }
            },
        ));
    }

    else if (item instanceof SchemaTreeItem) {
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection;
        const { rows, fields } = await connection.fetchTables();
        return rows.map(row => new TableTreeItem(
            extensionUri,
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ));
    }

    return [];
}


