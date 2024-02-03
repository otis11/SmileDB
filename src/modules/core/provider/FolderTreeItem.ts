import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode"
import { PoolConnectionConfig } from "../types"

export class FolderTreeItem extends TreeItem {
    public connectionConfig: PoolConnectionConfig

    constructor(config: {
        label: string,
        contextValue: string,
        connectionConfig: PoolConnectionConfig,
        description?: string,
        state?: TreeItemCollapsibleState
    }) {
        super(config.label, config.state !== undefined ? config.state : TreeItemCollapsibleState.Collapsed)
        this.iconPath = new ThemeIcon('folder')
        this.contextValue = config.contextValue
        this.description = config.description
        this.connectionConfig = config.connectionConfig
    }
}
