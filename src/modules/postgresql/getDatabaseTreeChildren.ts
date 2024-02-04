import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { DatabaseTreeItem, FolderTreeItem, PoolConnectionTreeItem, ProcedureTreeItem, SchemaTreeItem, TableTreeItem, getPoolConnection } from "../core"
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
            new FolderTreeItem({
                label: "tables",
                contextValue: "tableFolder",
                description: rows[0].totaltables?.toString(),
                connectionConfig: item.connectionConfig,
                state: rows[0].totaltables > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "views",
                contextValue: "viewFolder",
                connectionConfig: item.connectionConfig,
                description: rows[0].totalviews?.toString(),
                state: rows[0].totalviews > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "procedures",
                contextValue: "procedureFolder",
                connectionConfig: item.connectionConfig,
                description: rows[0].totalprocedures.toString(),
                state: rows[0].totalprocedures > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            }),
            new FolderTreeItem({
                label: "functions",
                contextValue: "functionFolder",
                connectionConfig: item.connectionConfig,
                description: rows[0].totalfunctions.toString(),
                state: rows[0].totalfunctions > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None
            })
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

    else if (item instanceof FolderTreeItem && item.contextValue === 'procedureFolder') {
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection
        const { rows, fields } = await connection.fetchProcedures()
        return rows.map(row => new ProcedureTreeItem({
            connectionConfig: item.connectionConfig,
            label: row[fields[0].name]?.toString() || ''
        }))
    }

    else if (item instanceof FolderTreeItem && item.contextValue === 'functionFolder') {
        const connection = getPoolConnection(item.connectionConfig) as PostgreSQLPoolConnection
        const { rows, fields } = await connection.fetchFunctions()
        return rows.map(row => new ProcedureTreeItem({
            connectionConfig: item.connectionConfig,
            label: row[fields[0].name]?.toString() || ''
        }))
    }

    return []
}


