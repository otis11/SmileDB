import { Event, EventEmitter, TreeDataProvider, TreeItem } from 'vscode'
import { getConnectionClientModule, getPoolConnectionConfigs } from '../common'
import { ErrorTreeItem } from './ErrorTreeItem'
import { GlobalTreeItem } from './GlobalTreeItem'
import { PoolConnectionTreeItem } from './PoolConnectionTreeItem'
import { WorkspaceTreeItem } from './WorkspaceTreeItem'

export class PoolConnectionTreeProvider implements TreeDataProvider<TreeItem> {
    getTreeItem(element: TreeItem): TreeItem {
        return element
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        if (!element) {
            // root element, return all pool connections
            return Promise.resolve([
                new WorkspaceTreeItem(),
                new GlobalTreeItem(),
            ])
        }

        else if (element instanceof WorkspaceTreeItem) {
            return Promise.resolve(
                getPoolConnectionConfigs().map(c => {
                    return new PoolConnectionTreeItem(c)
                })
            )
        }

        else if (element instanceof GlobalTreeItem) {
            return Promise.resolve(
                getPoolConnectionConfigs(true).map(c => {
                    return new PoolConnectionTreeItem(c)
                })
            )
        }
        const el = element as PoolConnectionTreeItem
        if (!el.connectionConfig?.moduleName) {
            return Promise.resolve([])
        }

        try {
            // module resolves now the children
            const module = getConnectionClientModule(el.connectionConfig.moduleName)
            const items = await module.getDatabaseTreeChildren(el)
            return Promise.resolve(items)
        } catch (e: any) {
            // generic error tree item when module throws error
            return Promise.resolve([new ErrorTreeItem(e.message, el.connectionConfig)])
        }

    }

    // all for refreshing the view
    private _onDidChangeTreeData: EventEmitter<PoolConnectionTreeItem | undefined | null | void> = new EventEmitter<PoolConnectionTreeItem | undefined | null | void>()
    readonly onDidChangeTreeData: Event<PoolConnectionTreeItem | undefined | null | void> = this._onDidChangeTreeData.event

    refresh(): void {
        this._onDidChangeTreeData.fire()
    }
}
