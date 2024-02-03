import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { DatabaseTreeItem, FolderTreeItem, PoolConnectionTreeItem, SchemaTreeItem, TableTreeItem, getPoolConnection } from "../core"
import { MSSQLPoolConnection } from "./MSSQLPoolConnection"

export async function getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as MSSQLPoolConnection
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
        const connection = getPoolConnection(item.connectionConfig) as MSSQLPoolConnection
        const { rows, fields } = await connection.fetchSchemas()
        return rows.map(row => new SchemaTreeItem(
            {
                ...item.connectionConfig,
                connection: {
                    ...item.connectionConfig.connection,
                    schema: row[fields[0].name]?.toString() || '',
                }
            },
        ))
    }

    else if (item instanceof SchemaTreeItem) {
        const connection = getPoolConnection(item.connectionConfig) as MSSQLPoolConnection
        const { rows } = await connection.fetchDatabaseStats()
        return [
            new FolderTreeItem({
                label: "tables",
                contextValue: "tableFolder",
                description: rows[0].TotalTables?.toString(),
                connectionConfig: item.connectionConfig,
                state: rows[0].TotalTables > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "views",
                contextValue: "viewFolder",
                connectionConfig: item.connectionConfig,
                description: rows[0].TotalViews?.toString(),
                state: rows[0].TotalViews > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
        ]
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'tableFolder') {
        const connection = getPoolConnection(item.connectionConfig) as MSSQLPoolConnection
        const { rows, fields } = await connection.fetchTables()
        return rows.map(row => new TableTreeItem(
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ))
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'viewFolder') {
        const connection = getPoolConnection(item.connectionConfig) as MSSQLPoolConnection
        const { rows, fields } = await connection.fetchViews()
        return rows.map(row => new TableTreeItem(
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ))
    }

    return []
}


