import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { PoolConnectionConfig } from "../types";

export class GroupTreeItem extends TreeItem {
    constructor(label: string, contextValue: string, public connectionConfig: PoolConnectionConfig) {
        super(label, TreeItemCollapsibleState.Collapsed);
        this.iconPath = new ThemeIcon('folder');
        this.contextValue = contextValue;
    }
}
