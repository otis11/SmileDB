import { TreeItem } from "vscode"
import { DatabaseTreeItem, PoolConnectionTreeItem, TableTreeItem, getPoolConnection } from "../core"
import { MongoDBPoolConnection } from "./MongoDBPoolConnection"

export async function getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as MongoDBPoolConnection
        const { rows, fields } = await connection.fetchDatabases()
        return rows.map(row => new DatabaseTreeItem(
            {
                ...item.connectionConfig,
                connection: {
                    ...item.connectionConfig.connection,
                    database: row[fields[0].name]?.toString() || '',
                }
            },
        ))
    }

    else if (item instanceof DatabaseTreeItem) {
        const connection = getPoolConnection(item.connectionConfig) as MongoDBPoolConnection
        const { rows, fields } = await connection.fetchTables()
        return rows.map(row => new TableTreeItem(
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ))
    }

    return []
}


