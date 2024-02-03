import { TreeItem } from "vscode"
import { DatabaseTreeItem, FolderTreeItem, PoolConnectionTreeItem, SchemaTreeItem, TableTreeItem, getPoolConnection } from "../core"
import { PostgreSQLPoolConnection } from "./PostgreSQLPoolConnection"

export async function getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection
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
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection
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
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection
        const { rows } = await connection.fetchDatabaseStats()
        return [
            new FolderTreeItem(
                "tables",
                "tableFolder",
                item.connectionConfig,
                rows[0].totaltables?.toString()),
            new FolderTreeItem(
                "views",
                "viewFolder",
                item.connectionConfig,
                rows[0].totalviews?.toString()),
        ]
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'tableFolder') {
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection
        const { rows, fields } = await connection.fetchTables()
        return rows.map(row => new TableTreeItem(
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ))
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'viewFolder') {
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection
        const { rows, fields } = await connection.fetchViews()
        return rows.map(row => new TableTreeItem(
            item.connectionConfig,
            row[fields[0].name]?.toString() || ''
        ))
    }

    return []
}


