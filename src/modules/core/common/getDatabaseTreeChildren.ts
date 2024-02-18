import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { DatabaseTreeItem, FolderTreeItem, PoolConnectionTreeItem, ProcedureTreeItem, QueryResultRow, SQLPoolConnection, SchemaTreeItem, TableTreeItem, getPoolConnection, showMessage } from "../"

export async function getDatabaseTreeChildrenSQL(item: TreeItem, config = { schemas: false }): Promise<TreeItem[]> {
    if (item instanceof PoolConnectionTreeItem) {
        // root
        const connection = getPoolConnection(item.connectionConfig) as SQLPoolConnection
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

    else if (item instanceof DatabaseTreeItem && config.schemas) {
        const connection = getPoolConnection(item.connectionConfig) as SQLPoolConnection
        // @ts-ignore exists when config.schemas is set to true
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

    else if (item instanceof SchemaTreeItem || item instanceof DatabaseTreeItem && !config.schemas) {
        const connection = getPoolConnection(item.connectionConfig) as SQLPoolConnection
        let result: QueryResultRow = {}
        let isLoadingError = false
        let keys = ['tables', 'procedures', 'functions', 'views']
        try {
            const r = await connection.fetchDatabaseStats()
            result = r.rows[0]
            keys = Object.keys(result)
        }
        catch (e: any) {
            showMessage('Error loading database stats', + e?.toString())
            isLoadingError = true
        }

        const folderItems = []
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            folderItems.push(new FolderTreeItem({
                label: key,
                contextValue: key,
                description: isLoadingError ? '' : result[key]?.toString(),
                connectionConfig: item.connectionConfig,
                state: isLoadingError ? TreeItemCollapsibleState.Collapsed : parseInt(result[key]?.toString() || '0') > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }))
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
        return await loadAndCreateTreeItem(item, 'fetchFunctions', ProcedureTreeItem)
    }

    return []
}

export async function loadAndCreateTreeItem(
    item: FolderTreeItem,
    functionName: 'fetchFunctions' | 'fetchProcedures' | 'fetchTables' | 'fetchViews',
    cls: any) {
    const connection = getPoolConnection(item.connectionConfig) as SQLPoolConnection
    const { rows, fields } = await connection[functionName]()
    return rows.map(row => new cls({
        connectionConfig: item.connectionConfig,
        label: row[fields[0].name]?.toString() || ''
    }))
}