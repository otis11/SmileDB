import { showQuickPickConnectionConfigs } from "../../shared/connection-config"
import { registerCommand } from "../../shared/helper"
import { getConnectionClientModule, getConnectionClientModules } from "../../shared/module"
import { Module, PoolConnectionConfig } from "../../shared/types"
import { window } from "vscode"
import { openEditConnectionWebview } from "./edit-connection/webview-backend"
import { openTableWebview } from "./table/webview-backend"
import { openHelpWebview } from "./help/webview-backend"
import { openCodeWebview } from "./code/webview-backend"
import { openActiveConnectionsWebview } from "./active-connections/webview-backend"

export const webviewsModule: Module = {
    name: 'Webviews',
    install() {
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
    }
}
