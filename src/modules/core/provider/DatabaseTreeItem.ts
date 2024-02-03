import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { getIconDarkLightPaths } from "../common"
import { PoolConnectionConfig } from "../types"

export class DatabaseTreeItem extends TreeItem {
    constructor(
        public connectionConfig: PoolConnectionConfig
    ) {
        super(connectionConfig.connection.database || '', TreeItemCollapsibleState.Collapsed)
        this.contextValue = "database"
        this.iconPath = getIconDarkLightPaths('database.svg')
    }
}
