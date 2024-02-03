import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { getIconDarkLightPaths } from "../common"
import { PoolConnectionConfig } from "../types"

export class SchemaTreeItem extends TreeItem {
    constructor(
        public connectionConfig: PoolConnectionConfig,
    ) {
        super(connectionConfig.connection.schema || '', TreeItemCollapsibleState.Collapsed)
        this.contextValue = 'schema'
        this.iconPath = getIconDarkLightPaths('schema.svg')
    }
}
