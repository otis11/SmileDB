import { copyToClipboard, registerCommand, showMessage } from "../../shared/helper"
import { Module } from "../../shared/types"
import { PoolConnectionTreeProvider } from "./PoolConnectionTreeProvider"
import { TreeItem, window } from "vscode"

export const treeViewModule: Module = {
    name: 'Tree View',
    install() {
        const databaseConnectionsProvider = new PoolConnectionTreeProvider()
        window.createTreeView('SmileDB', {
            treeDataProvider: databaseConnectionsProvider,
        })

        registerCommand('SmileDB.refreshTreeConnections', () => {
            databaseConnectionsProvider.refresh()
            showMessage('Tree Connections refreshed')
        })
        registerCommand('SmileDB.copyTreeItemLabel', (treeItem) => {
            if (treeItem instanceof TreeItem) {
                copyToClipboard(treeItem.label?.toString() || '')
            } else {
                window.showInformationMessage('Only available by right clicking on a tree item.')
            }
        })
        registerCommand('SmileDB.copyTreeItemDescription', (treeItem) => {
            if (treeItem instanceof TreeItem) {
                copyToClipboard(treeItem.description?.toString() || '')
            } else {
                window.showInformationMessage('Only available by right clicking on a tree item.')
            }
        })
    }
}