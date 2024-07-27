import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode"
import { PoolConnectionConfig } from "../../shared/types"

export class ProcedureTreeItem extends TreeItem {
    public connectionConfig: PoolConnectionConfig

    constructor(config: {
        label: string,
        connectionConfig: PoolConnectionConfig,
    }) {
        super(config.label, TreeItemCollapsibleState.None)
        this.iconPath = new ThemeIcon('server-process')
        this.connectionConfig = config.connectionConfig
        this.contextValue = 'procedure'

        this.command = {
            command: 'SmileDB.openProcedure',
            title: 'Open Code',
            arguments: [config.connectionConfig, config.label]
        }
    }
}
