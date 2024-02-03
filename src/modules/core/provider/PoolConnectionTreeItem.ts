import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { getConnectionClientModule, getIconDarkLightPaths, isPoolConnectionConfigActive } from "../common"
import { PoolConnectionConfig } from "../types"

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
