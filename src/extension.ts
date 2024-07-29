// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { installConnectionClientModule, installModule } from './shared/module'
import { mariadbModule } from './modules/mariadb/module'
import { mongodbModule } from './modules/mongodb/module'
import { webviewsModule } from './modules/webviews/module'
import { mssqlModule } from './modules/mssql/module'
import { mysqlModule } from './modules/mysql/module'
import { postgresModule } from './modules/postgresql/module'
import { redisModule } from './modules/redis/module'
import { logInfo } from './shared/logger'
import { setExtensionContext } from './shared/extension-context'
import { ExtensionStorage, setExtensionStorage } from './shared/extension-storage'
import { treeViewModule } from './modules/treeview/module'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // global storage and context
    setExtensionContext(context)
    setExtensionStorage(new ExtensionStorage(context.globalState, context.workspaceState))

    // modules
    installModule(webviewsModule)
    installModule(treeViewModule)

    // connection client modules
    installConnectionClientModule(mysqlModule)
    installConnectionClientModule(mongodbModule)
    installConnectionClientModule(postgresModule)
    installConnectionClientModule(redisModule)
    installConnectionClientModule(mariadbModule)
    installConnectionClientModule(mssqlModule)

    logInfo('Extension activated. All modules installed.')
}

// This method is called when your extension is deactivated
// export function deactivate() { }
