import { ExtensionContext } from 'vscode';
import { Module, PoolConnectionConfig, QueryConfigBase } from './types';
import { ExtensionStorage, deletePoolConnectionConfig, getConnectionClientModule, getConnectionClientModules, getIconDarkLightPaths, registerCommand, resetPoolConnectionConfigs, showMessage, showQuickPickConnectionConfigs } from './common';
import { PoolConnectionTreeProvider, } from './provider';
import * as vscode from 'vscode';
import { renderEditConnectionApp } from './webviews/edit-connection/app';
import { renderTableApp } from './webviews/table/app';
import { renderActiveConnectionsApp } from './webviews/active-connections/app';
import { renderHelpApp } from './webviews/help/app';

export const coreModule: Module = {
    name: 'Core',
    install(context: ExtensionContext) {
        const extensionStorage = new ExtensionStorage(context.globalState, context.workspaceState);

        // tree views
        const databaseConnectionsProvider = new PoolConnectionTreeProvider(context.extensionUri, extensionStorage);
        vscode.window.createTreeView('SmileDB', {
            treeDataProvider: databaseConnectionsProvider,
        });

        //commands
        registerCommand('SmileDB.editConnection', context, async (treeItem) => {
            if (treeItem) {
                renderEditConnectionApp(context.extensionUri, treeItem.connectionConfig, extensionStorage);

            } else {
                const connectionConfig = await showQuickPickConnectionConfigs(extensionStorage);

                if (connectionConfig) {
                    renderEditConnectionApp(context.extensionUri, connectionConfig, extensionStorage);
                }
            }
        });
        registerCommand('SmileDB.openTable', context, (
            config: PoolConnectionConfig,
            table: string,
        ) => {
            if (!config || !table) {
                // todo make available via quickpick?
                vscode.window.showInformationMessage('To open a table click on a table inside the tree view. This is not available via the command prompt.');
                return;
            }

            renderTableApp(
                context.extensionUri,
                config,
                table,
            );
        });
        registerCommand('SmileDB.deleteConnection', context, async (treeItem) => {
            if (treeItem) {
                deletePoolConnectionConfig(treeItem.connectionConfig, extensionStorage);
            } else {
                const connectionConfig = await showQuickPickConnectionConfigs(extensionStorage);

                if (connectionConfig) {
                    deletePoolConnectionConfig(connectionConfig, extensionStorage);
                }
            }
            vscode.commands.executeCommand('SmileDB.refreshConnectionsSilent');
            showMessage('Connection deleted');
        });
        registerCommand('SmileDB.refreshConnections', context, (treeItem) => {
            databaseConnectionsProvider.refresh();
            showMessage('Connections refreshed');
        });
        registerCommand('SmileDB.refreshConnectionsSilent', context, () => {
            databaseConnectionsProvider.refresh();
        });
        registerCommand('SmileDB.newConnection', context, async () => {
            const modules = getConnectionClientModules().map(d => d.name);
            let databaseModuleName = await vscode.window.showQuickPick(
                modules,
                {
                    "placeHolder": "Pick a database system",
                });
            if (databaseModuleName) {
                const module = getConnectionClientModule(databaseModuleName);
                renderEditConnectionApp(context.extensionUri, module.defaultPoolConnectionConfig, extensionStorage);
            }
        });
        registerCommand('SmileDB.resetConnectionStorage', context, () => {
            resetPoolConnectionConfigs(extensionStorage);
        });

        registerCommand('SmileDB.openActiveConnections', context, () => {
            renderActiveConnectionsApp(context.extensionUri, extensionStorage);
        });

        registerCommand('SmileDB.help', context, () => {
            renderHelpApp(context.extensionUri, extensionStorage);
        });
        registerCommand('SmileDB.copyTreeItemLabel', context, (treeItem) => {
            if (treeItem instanceof vscode.TreeItem) {
                vscode.env.clipboard.writeText(treeItem.label?.toString() || '');
            } else {
                vscode.window.showInformationMessage('Only available by right clicking on a tree item.');
            }
        });
    }
};

export * from './common';
export * from './types';
export * from './provider';
