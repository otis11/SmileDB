import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode"
import { PoolConnectionConfig } from "../types"

export class FolderTreeItem extends TreeItem {
    constructor(label: string, contextValue: string, public connectionConfig: PoolConnectionConfig, description?: string) {
        super(label, TreeItemCollapsibleState.Collapsed)
        this.iconPath = new ThemeIcon('folder')
        this.contextValue = contextValue
        this.description = description
    }
}
