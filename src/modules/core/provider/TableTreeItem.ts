import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import { PoolConnectionConfig, QueryConfigBase } from "../types";
import { getIconDarkLightPaths } from "../common";

export class TableTreeItem extends TreeItem {
    constructor(
        public readonly extensionUri: Uri,
        public readonly connectionConfig: PoolConnectionConfig,
        public readonly table: string,
    ) {
        super(table || '', TreeItemCollapsibleState.None);
        this.tooltip = table || '';
        this.contextValue = "table";
    }

    iconPath = getIconDarkLightPaths(this.extensionUri, 'table.svg');

    command = {
        command: 'SmileDB.openTable',
        title: 'Open Table',
        arguments: [this.connectionConfig, this.table]
    };
}
