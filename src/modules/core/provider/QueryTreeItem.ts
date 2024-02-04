import { ThemeIcon, TreeItem } from "vscode"
import { DatabaseQuery, PoolConnectionConfig } from "../types"

export class QueryTreeItem extends TreeItem {
    public connectionConfig: PoolConnectionConfig
    public query: DatabaseQuery

    constructor(config: {
        query: DatabaseQuery,
        connectionConfig: PoolConnectionConfig,
    }) {
        super(config.query.name)
        this.iconPath = new ThemeIcon('chevron-right')
        this.contextValue = "query"
        this.connectionConfig = config.connectionConfig
        this.query = config.query
    }
}
