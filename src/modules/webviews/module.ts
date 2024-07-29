import { deletePoolConnectionConfig, resetPoolConnectionConfigs, showQuickPickConnectionConfigs } from "../../shared/connection-config"
import { registerCommand, showMessage } from "../../shared/helper"
import { getConnectionClientModule, getConnectionClientModules } from "../../shared/module"
import { Module, PoolConnectionConfig } from "../../shared/types"
import { commands, window } from "vscode"
import { openEditConnectionWebview } from "./edit-connection/webview-backend"
import { openTableWebview } from "./table/webview-backend"
import { openHelpWebview } from "./help/webview-backend"
import { openCodeWebview } from "./code/webview-backend"
import { openSearchWebview } from "./search/webview-backend"
import { openActiveConnectionsWebview } from "./active-connections/webview-backend"
import { getPoolConnection } from "../../shared/database-connections"

export const webviewsModule: Module = {
    name: 'Webviews',
    install() {
        registerCommand('SmileDB.openSearch', () => {
            openSearchWebview()
        })

        registerCommand('SmileDB.editConnection', async (treeItem) => {
            if (treeItem) {
                openEditConnectionWebview(treeItem.connectionConfig)
        
            } else {
                const connectionConfig = await showQuickPickConnectionConfigs()
        
                if (connectionConfig) {
                    openEditConnectionWebview(connectionConfig)
                }
            }
        })

        registerCommand('SmileDB.newConnection', async () => {
            const modules = getConnectionClientModules().map(d => d.name)
            const databaseModuleName = await window.showQuickPick(
                modules,
                {
                    "placeHolder": "Pick a database system",
                })
            if (databaseModuleName) {
                const module = getConnectionClientModule(databaseModuleName)
                openEditConnectionWebview(module.getDefaultPoolConnectionConfig())
            }
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
            commands.executeCommand('SmileDB.refreshTreeConnections')
            showMessage('Connection deleted')
        })
        
        registerCommand('SmileDB.resetConnectionStorage', () => {
            resetPoolConnectionConfigs()
        })

        registerCommand('SmileDB.openTable', (
            config: PoolConnectionConfig,
            table: string,
        ) => {
            if (!config || !table) {
                // todo make available via quickpick?
                window.showInformationMessage('To open a table click on a table inside the tree view. This is not available via the command prompt.')
                return
            }

            openTableWebview(
                config,
                table,
            )
        })

        registerCommand('SmileDB.help', () => {
            openHelpWebview()
        })

        registerCommand('SmileDB.openCode', async (
            code: string,
            title: string,
        ) => {
            openCodeWebview({ code, title })
        })

        registerCommand('SmileDB.openActiveConnections', () => {
            openActiveConnectionsWebview()
        })

        registerCommand('SmileDB.openProcedure', async (
            config: PoolConnectionConfig,
            name: string,
        ) => {
            if (!config || !name) {
                // todo make available via quickpick?
                window.showInformationMessage('To open a procedure click on a procedure inside the tree view. This is not available via the command prompt.')
                return
            }
            // @ts-ignore
            const result = await getPoolConnection(config).fetchProcedure(name)
            openCodeWebview({ code: result, title: "Procedure: " + name })
        })
        registerCommand('SmileDB.openFunction', async (
            config: PoolConnectionConfig,
            name: string,
        ) => {
            if (!config || !name) {
                // todo make available via quickpick?
                window.showInformationMessage('To open a function click on a function inside the tree view. This is not available via the command prompt.')
                return
            }
            // @ts-ignore
            const result = await getPoolConnection(config).fetchFunction(name)
            openCodeWebview({ code: result, title: "Function: " + name })
        })
    }
}

