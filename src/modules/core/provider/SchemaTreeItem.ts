import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { PoolConnectionConfig, QueryConfigBase } from "../types";
import { getIconDarkLightPaths } from "../common";

export class SchemaTreeItem extends TreeItem {
    constructor(
        extensionUri: Uri,
        public connectionConfig: PoolConnectionConfig,
    ) {
        super(connectionConfig.connection.schema || '', TreeItemCollapsibleState.Collapsed);
        this.contextValue = 'schema';
        this.iconPath = getIconDarkLightPaths(extensionUri, 'schema.svg');
    }
}
