import { TreeItem } from "vscode"
import { RedisPoolConnection } from "./RedisPoolConnection"
import { PoolConnectionTreeItem } from "../treeview/PoolConnectionTreeItem"
import { TableTreeItem } from "../treeview/TableTreeItem"
import {getPoolConnection} from "../../shared/database-connections"

export async function getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as RedisPoolConnection
        const { rows, fields } = await connection.fetchDatabases()
        return rows.map(row => new TableTreeItem(
            {
                connectionConfig: {
                    ...item.connectionConfig,
                    connection: {
                        ...item.connectionConfig.connection,
                        database: row[fields[0].name]?.toString() || '',
                    }
                },
                label: row[fields[0].name]?.toString() || ''
            }


        ))
    }

    return []
}


