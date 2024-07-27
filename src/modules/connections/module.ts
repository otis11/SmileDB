import { deletePoolConnectionConfig, resetPoolConnectionConfigs, showQuickPickConnectionConfigs } from "../../shared/connection-config"
import { registerCommand, showMessage } from "../../shared/helper"
import { Module } from "../../shared/types"
import { commands } from "vscode"

export const connectionsModule: Module = {
    name: 'Connections',
    install() {
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
    }
}