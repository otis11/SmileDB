import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { getIconDarkLightPaths } from "../../shared/helper"
import { PoolConnectionConfig } from "../../shared/types"

export class SchemaTreeItem extends TreeItem {
    constructor(
        public connectionConfig: PoolConnectionConfig,
    ) {
        super(connectionConfig.connection.schema || '', TreeItemCollapsibleState.Collapsed)
        this.contextValue = 'schema'
        this.iconPath = getIconDarkLightPaths('schema.svg')
    }
}
