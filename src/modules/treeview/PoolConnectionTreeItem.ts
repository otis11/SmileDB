import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { PoolConnectionConfig } from "../../shared/types"
import { isPoolConnectionConfigActive } from "../../shared/database-connections"
import { getConnectionClientModule } from "../../shared/module"
import { getIconDarkLightPaths } from "../../shared/helper"

export class PoolConnectionTreeItem extends TreeItem {
    constructor(
        public readonly connectionConfig: PoolConnectionConfig,
    ) {
        super(connectionConfig.name, TreeItemCollapsibleState.Collapsed)
        this.tooltip = `${connectionConfig.connection.host} ${connectionConfig.connection.port}`
        this.description = connectionConfig.connection.port?.toString()
        this.contextValue = "connection"

        let icon = ''
        if (isPoolConnectionConfigActive(connectionConfig)) {
            icon = getConnectionClientModule(connectionConfig.moduleName).iconActive
        } else {
            icon = getConnectionClientModule(connectionConfig.moduleName).icon
        }

        this.iconPath = getIconDarkLightPaths(icon)

    }
}
