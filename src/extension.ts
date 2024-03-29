// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { initializeGlobals } from './global'
import { coreModule, installConnectionClientModule, installModule, logInfo } from './modules/core'
import { mariadbModule } from './modules/mariadb'
import { mongodbModule } from './modules/mongodb'
import { mssqlModule } from './modules/mssql'
import { mysqlModule } from './modules/mysql'
import { postgresModule } from './modules/postgresql'
import { redisModule } from './modules/redis'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // global storage and context
    initializeGlobals(context)

    // modules
    installModule(coreModule)

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
