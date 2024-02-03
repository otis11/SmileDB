import { TreeItem } from "vscode"
import { DatabaseTreeItem, FolderTreeItem, PoolConnectionTreeItem, TableTreeItem, getPoolConnection } from "../core"
import { MySQLPoolConnection } from "./MySQLPoolConnection"

export async function getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as MySQLPoolConnection
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
        const connection = getPoolConnection(item.connectionConfig) as MySQLPoolConnection
        const { rows } = await connection.fetchDatabaseStats()
        return [
            new FolderTreeItem(
                "tables",
                "tableFolder",
                item.connectionConfig,
                rows[0].TotalTables?.toString()),
            new FolderTreeItem(
                "views",
                "viewFolder",
                item.connectionConfig,
                rows[0].TotalViews?.toString()),
        ]
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'tableFolder') {
        const connection = getPoolConnection(item.connectionConfig) as MySQLPoolConnection
        const { rows, fields } = await connection.fetchTables()
        return rows.map(row => new TableTreeItem(
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ))
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'viewFolder') {
        const connection = getPoolConnection(item.connectionConfig) as MySQLPoolConnection
        const { rows, fields } = await connection.fetchViews()
        return rows.map(row => new TableTreeItem(
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ))
    }

    return []
}


