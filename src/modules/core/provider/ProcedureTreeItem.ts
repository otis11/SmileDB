import { TreeItem, TreeItemCollapsibleState } from "vscode"
import { PoolConnectionConfig } from "../types"

export class ProcedureTreeItem extends TreeItem {
    public connectionConfig: PoolConnectionConfig

    constructor(config: {
        label: string,
        connectionConfig: PoolConnectionConfig,
    }) {
        super(config.label, TreeItemCollapsibleState.None)
        // this.iconPath = new ThemeIcon('play')
        this.connectionConfig = config.connectionConfig
    }
}
