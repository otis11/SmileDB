import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode"
import { getQueriesForConfig } from "../common"
import { DatabaseQuery, PoolConnectionConfig } from "../types"

export class QueriesTreeItem extends TreeItem {
    public connectionConfig: PoolConnectionConfig
    public queries: DatabaseQuery[]

    constructor(config: {
        connectionConfig: PoolConnectionConfig,
    }) {
        const queries = getQueriesForConfig(config.connectionConfig)
        super("queries", queries.length === 0 ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Collapsed)
        this.iconPath = new ThemeIcon('folder')
        this.contextValue = "queries"
        this.description = queries.length.toString()
        this.connectionConfig = config.connectionConfig
        this.queries = queries
    }
}
