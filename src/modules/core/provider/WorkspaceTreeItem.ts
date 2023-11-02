import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";

export class WorkspaceTreeItem extends TreeItem {
    constructor() {
        super('Workspace', TreeItemCollapsibleState.Expanded);
        this.iconPath = new ThemeIcon('window');
    }
}
