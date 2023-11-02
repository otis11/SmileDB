import { TreeItem, Uri } from "vscode";
import { DatabaseTreeItem, PoolConnectionTreeItem, TableTreeItem, getPoolConnection } from "../core";
import { MySQLPoolConnection } from "./MySQLPoolConnection";

export async function getDatabaseTreeChildren(extensionUri: Uri, item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as MySQLPoolConnection;
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
        const connection = getPoolConnection(item.connectionConfig) as MySQLPoolConnection;
        const { rows, fields } = await connection.fetchTables();
        return rows.map(row => new TableTreeItem(
            extensionUri,
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ));
    }

    return [];
}


