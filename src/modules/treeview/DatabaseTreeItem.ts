import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { getIconDarkLightPaths } from "../../shared/helper"
import { PoolConnectionConfig } from "../../shared/types"

export class DatabaseTreeItem extends TreeItem {
    constructor(
        public connectionConfig: PoolConnectionConfig
    ) {
        super(connectionConfig.connection.database || '', TreeItemCollapsibleState.Collapsed)
        this.contextValue = "database"
        this.iconPath = getIconDarkLightPaths('database.svg')
    }
}
