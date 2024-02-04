import * as vscode from 'vscode'
import { copyToClipboard, deletePoolConnectionConfig, getConnectionClientModule, getConnectionClientModules, registerCommand, resetPoolConnectionConfigs, showMessage, showQuickPickConnectionConfigs } from './common'
import { PoolConnectionTreeProvider, } from './provider'
import { Module, PoolConnectionConfig } from './types'
import { renderActiveConnectionsApp } from './webviews/active-connections/app'
import { renderEditConnectionApp } from './webviews/edit-connection/app'
import { renderHelpApp } from './webviews/help/app'
import { renderTableApp } from './webviews/table/app'

export const coreModule: Module = {
    name: 'Core',
    install() {
        // tree views
        const databaseConnectionsProvider = new PoolConnectionTreeProvider()
        vscode.window.createTreeView('SmileDB', {
            treeDataProvider: databaseConnectionsProvider,
        })

        //commands
        registerCommand('SmileDB.editConnection', async (treeItem) => {
            if (treeItem) {
                renderEditConnectionApp(treeItem.connectionConfig)

            } else {
                const connectionConfig = await showQuickPickConnectionConfigs()

                if (connectionConfig) {
                    renderEditConnectionApp(connectionConfig)
                }
            }
        })
        registerCommand('SmileDB.openTable', (
            config: PoolConnectionConfig,
            table: string,
        ) => {
            if (!config || !table) {
                // todo make available via quickpick?
                vscode.window.showInformationMessage('To open a table click on a table inside the tree view. This is not available via the command prompt.')
                return
            }

            renderTableApp(
                config,
                table,
            )
        })
        registerCommand('SmileDB.deleteConnection', async (treeItem) => {
            if (treeItem) {
                deletePoolConnectionConfig(treeItem.connectionConfig)
            } else {
                const connectionConfig = await showQuickPickConnectionConfigs()

                if (connectionConfig) {
                    deletePoolConnectionConfig(connectionConfig)
                }
            }
            vscode.commands.executeCommand('SmileDB.refreshConnectionsSilent')
            showMessage('Connection deleted')
        })
        registerCommand('SmileDB.refreshConnections', (treeItem) => {
            databaseConnectionsProvider.refresh()
            showMessage('Connections refreshed')
        })
        registerCommand('SmileDB.refreshConnectionsSilent', () => {
            databaseConnectionsProvider.refresh()
        })
        registerCommand('SmileDB.newConnection', async () => {
            const modules = getConnectionClientModules().map(d => d.name)
            const databaseModuleName = await vscode.window.showQuickPick(
                modules,
                {
                    "placeHolder": "Pick a database system",
                })
            if (databaseModuleName) {
                const module = getConnectionClientModule(databaseModuleName)
                renderEditConnectionApp(module.getDefaultPoolConnectionConfig())
            }
        })
        registerCommand('SmileDB.resetConnectionStorage', () => {
            resetPoolConnectionConfigs()
        })

        registerCommand('SmileDB.openActiveConnections', () => {
            renderActiveConnectionsApp()
        })

        registerCommand('SmileDB.help', () => {
            renderHelpApp()
        })
        registerCommand('SmileDB.copyTreeItemLabel', (treeItem) => {
            if (treeItem instanceof vscode.TreeItem) {
                copyToClipboard(treeItem.label?.toString() || '')
            } else {
                vscode.window.showInformationMessage('Only available by right clicking on a tree item.')
            }
        })
    }
}

export * from './common'
export * from './provider'
export * from './types'

