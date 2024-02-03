import { TreeItem, TreeDataProvider, TreeItemCollapsibleState, EventEmitter, Event, Uri } from 'vscode'
import { ExtensionStorage, getConnectionClientModule, getPoolConnection, getPoolConnectionConfigs } from '../common'
import { PoolConnectionConfig } from '../types'
import { PoolConnectionTreeItem } from './PoolConnectionTreeItem'
import { GlobalTreeItem } from './GlobalTreeItem'
import { WorkspaceTreeItem } from './WorkspaceTreeItem'
import { ErrorTreeItem } from './ErrorTreeItem'

export class PoolConnectionTreeProvider implements TreeDataProvider<TreeItem> {
    constructor(
        private readonly extensionUri: Uri,
        private readonly storage: ExtensionStorage
    ) { }

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
                getPoolConnectionConfigs(this.storage).map(c => {
                    return new PoolConnectionTreeItem(this.extensionUri, c)
                })
            )
        }

        else if (element instanceof GlobalTreeItem) {
            return Promise.resolve(
                getPoolConnectionConfigs(this.storage, true).map(c => {
                    return new PoolConnectionTreeItem(this.extensionUri, c)
                })
            )
        }

        // @ts-ignore
        if (!element.connectionConfig?.moduleName) {
            return Promise.resolve([])
        }

        try {
            // module resolves now the children
            // @ts-ignore
            const module = getConnectionClientModule(element.connectionConfig.moduleName)
            // @ts-ignore
            const items = await module.getDatabaseTreeChildren(this.extensionUri, element)
            return Promise.resolve(items)
        } catch (e: any) {
            // generic error tree item when module throws error
            // @ts-ignore
            return Promise.resolve([new ErrorTreeItem(e.message, element.connectionConfig)])
        }

    }

    // all for refreshing the view
    private _onDidChangeTreeData: EventEmitter<PoolConnectionTreeItem | undefined | null | void> = new EventEmitter<PoolConnectionTreeItem | undefined | null | void>()
    readonly onDidChangeTreeData: Event<PoolConnectionTreeItem | undefined | null | void> = this._onDidChangeTreeData.event

    refresh(): void {
        this._onDidChangeTreeData.fire()
    }
}
