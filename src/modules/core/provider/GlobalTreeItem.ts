import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode"

export class GlobalTreeItem extends TreeItem {
    constructor() {
        super('Global', TreeItemCollapsibleState.Expanded)
        this.iconPath = new ThemeIcon('globe')
    }
}
