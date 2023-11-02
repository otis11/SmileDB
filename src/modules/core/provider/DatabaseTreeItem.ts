import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { PoolConnectionConfig, QueryConfigBase } from "../types";
import { getIconDarkLightPaths } from "../common";

export class DatabaseTreeItem extends TreeItem {
    constructor(
        extensionUri: Uri,
        public connectionConfig: PoolConnectionConfig
    ) {
        super(connectionConfig.connection.database || '', TreeItemCollapsibleState.Collapsed);
        this.iconPath = getIconDarkLightPaths(extensionUri, 'database.svg');
    }
}
