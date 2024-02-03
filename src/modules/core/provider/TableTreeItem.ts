import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { getIconDarkLightPaths } from "../common"
import { PoolConnectionConfig } from "../types"

export class TableTreeItem extends TreeItem {
    constructor(
        public readonly connectionConfig: PoolConnectionConfig,
        public readonly table: string,
    ) {
        super(table || '', TreeItemCollapsibleState.None)
        this.tooltip = table || ''
        this.contextValue = "table"
    }

    iconPath = getIconDarkLightPaths('table.svg')

    command = {
        command: 'SmileDB.openTable',
        title: 'Open Table',
        arguments: [this.connectionConfig, this.table]
    }
}
