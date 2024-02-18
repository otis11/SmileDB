import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { getIconDarkLightPaths } from "../common"
import { PoolConnectionConfig } from "../types"

export class TableTreeItem extends TreeItem {
    readonly connectionConfig: PoolConnectionConfig
    readonly table: string
    constructor(config: {
        label: string,
        connectionConfig: PoolConnectionConfig,
    }) {
        super(config.label || '', TreeItemCollapsibleState.None)
        this.tooltip = config.label || ''
        this.contextValue = "table"
        this.connectionConfig = config.connectionConfig
        this.table = config.label

        this.iconPath = getIconDarkLightPaths('table.svg')

        this.command = {
            command: 'SmileDB.openTable',
            title: 'Open Table',
            arguments: [this.connectionConfig, this.table]
        }
    }
}
