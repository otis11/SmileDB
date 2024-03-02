import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { DatabaseTreeItem, FolderTreeItem, FunctionTreeItem, PoolConnectionTreeItem, ProcedureTreeItem, SQLDatabaseStats, SQLPoolConnection, SchemaTreeItem, TableTreeItem, getPoolConnection, showMessage } from "../"
import { getConfig } from "../../../config"

export async function getDatabaseTreeChildrenSQL(item: TreeItem, config = { schemas: false }): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as SQLPoolConnection
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

    else if (item instanceof DatabaseTreeItem && config.schemas) {
        const connection = getPoolConnection(item.connectionConfig) as SQLPoolConnection
        // @ts-ignore exists when config.schemas is set to true
        const schemas = await connection.fetchSchemas()
        return schemas.map(schema => new SchemaTreeItem(
            {
                ...item.connectionConfig,
                connection: {
                    ...item.connectionConfig.connection,
                    schema: schema,
                }
            },
        ))
    }

    else if (item instanceof SchemaTreeItem || item instanceof DatabaseTreeItem && !config.schemas) {
        const connection = getPoolConnection(item.connectionConfig) as SQLPoolConnection
        let result: SQLDatabaseStats = { tables: 0, procedures: 0, functions: 0, views: 0 }
        let isLoadingError = false
        const keys: (keyof SQLDatabaseStats)[] = ['tables', 'procedures', 'functions', 'views']
        try {
            result = await connection.fetchDatabaseStats()
        }
        catch (e: any) {
            showMessage('Error loading database stats', + e?.toString())
            isLoadingError = true
        }

        const folderItems = []
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            let state = isLoadingError ? TreeItemCollapsibleState.Collapsed : result[key] > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None

            if (key === 'tables') {
                if (getConfig().tree.expandTablesInstantly && result[key] > 0) {
                    state = TreeItemCollapsibleState.Expanded
                }
            }

            const folderItem = new FolderTreeItem({
                label: key,
                contextValue: key,
                description: isLoadingError ? '' : result[key]?.toString(),
                connectionConfig: item.connectionConfig,
                state,
            })
            folderItems.push(folderItem)
        }
        return folderItems
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'tables') {
        return await loadAndCreateTreeItem(item, 'fetchTables', TableTreeItem)
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'views') {
        return await loadAndCreateTreeItem(item, 'fetchViews', TableTreeItem)
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'procedures') {
        return await loadAndCreateTreeItem(item, 'fetchProcedures', ProcedureTreeItem)
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'functions') {
        return await loadAndCreateTreeItem(item, 'fetchFunctions', FunctionTreeItem)
    }

    return []
}

export async function loadAndCreateTreeItem(
    item: FolderTreeItem,
    functionName: 'fetchFunctions' | 'fetchProcedures' | 'fetchTables' | 'fetchViews',
    cls: any) {
    const connection = getPoolConnection(item.connectionConfig) as SQLPoolConnection
    const values = await connection[functionName]()
    return values.map(value => new cls({
        connectionConfig: item.connectionConfig,
        label: value
    }))
}
