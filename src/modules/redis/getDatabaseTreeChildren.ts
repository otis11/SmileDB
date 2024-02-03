import { TreeItem } from "vscode"
import { PoolConnectionTreeItem, TableTreeItem, getPoolConnection } from "../core"
import { RedisPoolConnection } from "./RedisPoolConnection"

export async function getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as RedisPoolConnection
        const { rows, fields } = await connection.fetchDatabases()
        return rows.map(row => new TableTreeItem(
            {
                ...item.connectionConfig,
                connection: {
                    ...item.connectionConfig.connection,
                    database: row[fields[0].name]?.toString() || '',
                }
            },
            row[fields[0].name]?.toString() || ''
        ))
    }

    return []
}


