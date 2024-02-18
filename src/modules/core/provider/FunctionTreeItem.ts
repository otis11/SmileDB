import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { PoolConnectionConfig } from "../types"

export class FunctionTreeItem extends TreeItem {
    public connectionConfig: PoolConnectionConfig

    constructor(config: {
        label: string,
        connectionConfig: PoolConnectionConfig,
    }) {
        super(config.label, TreeItemCollapsibleState.None)
        // this.iconPath = new ThemeIcon('play')
        this.connectionConfig = config.connectionConfig
        this.contextValue = 'function'

        this.command = {
            command: 'SmileDB.openFunction',
            title: 'Open Code',
            arguments: [config.connectionConfig, config.label]
        }
    }
}
