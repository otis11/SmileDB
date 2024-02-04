import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { DatabaseTreeItem, FolderTreeItem, PoolConnectionTreeItem, ProcedureTreeItem, SchemaTreeItem, TableTreeItem, getPoolConnection } from "../core"
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
        const totalTables = parseInt(rows[0].TotalTables?.toString() || "0")
        const totalViews = parseInt(rows[0].TotalViews?.toString() || "0")
        const totalProcedures = parseInt(rows[0].TotalProcedures?.toString() || "0")
        const totalFunctions = parseInt(rows[0].TotalFunctions?.toString() || "0")
        return [
            new FolderTreeItem({
                label: "tables",
                contextValue: "tableFolder",
                description: totalTables.toString(),
                connectionConfig: item.connectionConfig,
                state: totalTables > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "views",
                contextValue: "viewFolder",
                connectionConfig: item.connectionConfig,
                description: totalViews.toString(),
                state: totalViews > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "procedures",
                contextValue: "procedureFolder",
                connectionConfig: item.connectionConfig,
                description: totalProcedures.toString(),
                state: totalProcedures > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "functions",
                contextValue: "functionFolder",
                connectionConfig: item.connectionConfig,
                description: totalFunctions.toString(),
                state: totalFunctions > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            })
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

    else if (item instanceof FolderTreeItem && item.contextValue === 'procedureFolder') {
        const connection = getPoolConnection(item.connectionConfig) as MSSQLPoolConnection
        const { rows, fields } = await connection.fetchProcedures()
        return rows.map(row => new ProcedureTreeItem({
            connectionConfig: item.connectionConfig,
            label: row[fields[0].name]?.toString() || ''
        }))
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'functionFolder') {
        const connection = getPoolConnection(item.connectionConfig) as MSSQLPoolConnection
        const { rows, fields } = await connection.fetchFunctions()
        return rows.map(row => new ProcedureTreeItem({
            connectionConfig: item.connectionConfig,
            label: row[fields[0].name]?.toString() || ''
        }))
    }

    return []
}


