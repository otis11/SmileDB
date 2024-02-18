import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { DatabaseTreeItem, FolderTreeItem, PoolConnectionTreeItem, TableTreeItem, getPoolConnection, loadAndCreateTreeItem } from "../core"
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
        const { rows } = await connection.fetchDatabaseStats()
        const totalCollections = parseInt(rows[0].collections?.toString() || "0")
        const totalViews = parseInt(rows[0].views?.toString() || "0")
        return [
            new FolderTreeItem({
                label: "collections",
                contextValue: "collectionFolder",
                connectionConfig: item.connectionConfig,
                description: totalCollections.toString(),
                state: totalCollections > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "views",
                contextValue: "viewFolder",
                connectionConfig: item.connectionConfig,
                description: totalViews.toString(),
                state: totalViews > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
        ]
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'collectionFolder') {
        return await loadAndCreateTreeItem(item, 'fetchTables', TableTreeItem)
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'viewFolder') {
        return await loadAndCreateTreeItem(item, 'fetchViews', TableTreeItem)
    }

    return []
}


