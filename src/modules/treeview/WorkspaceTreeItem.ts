import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode"

export class WorkspaceTreeItem extends TreeItem {
    constructor() {
        super('Workspace', TreeItemCollapsibleState.Expanded)
        this.contextValue = 'workspace'
        this.iconPath = new ThemeIcon('window')
    }
}
