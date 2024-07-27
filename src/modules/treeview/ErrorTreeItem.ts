import { ThemeColor, ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode"
import { PoolConnectionConfig } from "../../shared/types"

export class ErrorTreeItem extends TreeItem {
    constructor(
        public readonly message: string,
        public readonly connectionConfig: PoolConnectionConfig,
    ) {
        super(message, TreeItemCollapsibleState.None)
        this.iconPath = new ThemeIcon('debug-disconnect', new ThemeColor('errorForeground'))
        this.tooltip = 'Error. Edit connection'
        this.contextValue = "error"
        this.command = {
            command: 'SmileDB.editConnection',
            title: 'Edit Connection',
            arguments: [this]
        }
    }
}
