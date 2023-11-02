import { TreeItem, Uri } from "vscode";
import { DatabaseTreeItem, PoolConnectionTreeItem, TableTreeItem, getPoolConnection } from "../core";
import { RedisPoolConnection } from "./RedisPoolConnection";

export async function getDatabaseTreeChildren(extensionUri: Uri, item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as RedisPoolConnection;
        const { rows, fields } = await connection.fetchDatabases();
        return rows.map(row => new TableTreeItem(
            extensionUri,
            {
                ...item.connectionConfig,
                connection: {
                    ...item.connectionConfig.connection,
                    database: row[fields[0].name]?.toString() || '',
                }
            },
            row[fields[0].name]?.toString() || ''
        ));
    }

    return [];
}


