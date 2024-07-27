import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { MongoDBPoolConnection } from "./MongoDBPoolConnection"
import { PoolConnectionTreeItem } from "../treeview/PoolConnectionTreeItem"
import { getPoolConnection } from "../../shared/database-connections"
import { DatabaseTreeItem } from "../treeview/DatabaseTreeItem"
import { FolderTreeItem } from "../treeview/FolderTreeItem"
import { loadAndCreateTreeItem } from "../treeview/get-database-tree-children"
import { TableTreeItem } from "../treeview/TableTreeItem"

export async function getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as MongoDBPoolConnection
        const databases = await connection.fetchDatabases()
        return databases.map(database => new DatabaseTreeItem(
            {
                ...item.connectionConfig,
                connection: {
                    ...item.connectionConfig.connection,
                    database,
                }
            },
        ))
    }

    else if (item instanceof DatabaseTreeItem) {
        const connection = getPoolConnection(item.connectionConfig) as MongoDBPoolConnection
        const result = await connection.fetchDatabaseStats()
        const totalCollections = result.collections
        const totalViews = result.views
        return [
            new FolderTreeItem({
                label: "collections",
                contextValue: "collections",
                connectionConfig: item.connectionConfig,
                description: totalCollections.toString(),
                state: totalCollections > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "views",
                contextValue: "views",
                connectionConfig: item.connectionConfig,
                description: totalViews.toString(),
                state: totalViews > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
        ]
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'collections') {
        return await loadAndCreateTreeItem(item, 'fetchTables', TableTreeItem)
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'views') {
        return await loadAndCreateTreeItem(item, 'fetchViews', TableTreeItem)
    }

    return []
}


