import { PoolConnectionConfig } from "../../../shared/types"

export function getEditConnectionWebviewHtmlBody(connectionConfig: PoolConnectionConfig): string {
    return /*html*/`
    <div class="container">
    <vscode-text-field type="text" id="name" value="${connectionConfig.name}">Name</vscode-text-field>
    <vscode-divider class="mb-3 mt-3"></vscode-divider>
    <vscode-panels>
        <vscode-panel-tab id="tab-connection">Connection</vscode-panel-tab>
        <vscode-panel-tab id="tab-authentication">Authentication</vscode-panel-tab>
        <vscode-panel-tab id="tab-advanced">Advanced</vscode-panel-tab>
        <vscode-panel-view id="view-connection">
            <div class="mt-2 mb-5">
                <p class="mb-2">Choose a connection option</p>
                <vscode-dropdown id="connection-method-select">
                    ${connectionConfig.connection.allowedMethods.map(method => "<vscode-option value='" + method + "'>" + method + "</vscode-option>").join('')}
                </vscode-dropdown>
            </div>
            <div id="connection-host-port-database" class="connection">
                <div class="row mb-3">
                    <vscode-text-field type="text" id="host" value="${connectionConfig.connection.host}" class="mr-2">Host</vscode-text-field>
                    <vscode-text-field type="number" id="port" value="${connectionConfig.connection.port}">Port</vscode-text-field>
                </div>
                <div class="row mb-3">
                    <vscode-text-field type="text" id="database" value="${connectionConfig.connection.database}">Database</vscode-text-field>
                </div>
                <div class="row ">
                    <p>Initial database for connection. All database will be available after the initial connection.</p>
                </div>
            </div>
            <div id="connection-file" class="connection">
                <div class="row mt-2">
                    <p>Select a file</p>
                </div>
                <div class="row mb-3">
                    <div id="file-icon" class="mr-2"><i class="codicon codicon-new-file"></i></div>
                    <vscode-text-field type="text" id="file" disabled placeholder="Upload a file by clicking on the file icon "></vscode-text-field>
                </div>
            </div>
        </vscode-panel-view>
        <vscode-panel-view id="view-authentication">
            <div class="mt-2 mb-5">
                <p class="mb-2">Choose a authentication option</p>
                <vscode-dropdown id="authentication-method-select">
                    ${connectionConfig.authentication.allowedMethods.map(method => "<vscode-option value='" + method + "'>" + method + "</vscode-option>").join('')}
                </vscode-dropdown>
            </div>
            <div id="authentication-username-password" class="authentication">
                <div class="row">
                    <vscode-text-field class="mr-5" type="text" id="user" value="${connectionConfig.authentication.username}">User</vscode-text-field>
                </div>
                <div class="row mb-3">
                    <vscode-text-field class="mr-5" type="password" id="password" value="${connectionConfig.authentication.password}">Password</vscode-text-field>
                </div>
                <div class="row">
                    <vscode-checkbox id="save-authentication" checked="${connectionConfig.authentication.saveAuthentication}">Save Authentication</vscode-checkbox>
                </div>
            </div>
        </vscode-panel-view>
        <vscode-panel-view id="view-advanced">
            <div class="row mt-2">
                <p>Connections are stored per workspace by default. If "Global" is checked, this connection will be available in every workspace.</p>
            </div>
            <div class="row mb-3">
                <vscode-checkbox id="global">Global</vscode-checkbox>
            </div>
            <div class="row">
                <p>"Readonly" connections allow read actions only.</p>
            </div>
            <div class="row mb-3">
                <vscode-checkbox id="readonly">Readonly</vscode-checkbox>
            </div>
            <div class="row">
                <p>Trust the server certificate (Activate for local development or self signed certificates).</p>
             </div>
            <div class="row mb-3">
                <vscode-checkbox id="trust-server-certificate" checked="${connectionConfig.advanced.trustServerCertificate}">Trust the server certificate</vscode-checkbox>
            </div>
            <div class="row mb-3">
                <vscode-text-field type="number" id="stay-alive-in-seconds" value="${connectionConfig.advanced.stayAliveInSeconds}">Connection stays alive for (in seconds). When used, the timer resets.</vscode-text-field>
            </div>
            <div class="row">
                <p>How order by on tables should work. 'database' will filter the data on the database side (send order by request and reload each time). 'client' will order the data inside the webview without sending a request to the backend</p>
            </div>
            <div class="row">
                <vscode-dropdown id="advanced-order-by-method-select">
                    ${connectionConfig.advanced.allowedOrderByMethods.map(method => "<vscode-option value='" + method + "'>" + method + "</vscode-option>").join('')}
                </vscode-dropdown>
            </div>
        </vscode-panel-view>
    </vscode-panels>

    <vscode-divider class="mb-3 mt-3"></vscode-divider>
    <div class="row mb-3">
      <vscode-button appearance="secondary" id="test-connection" class="mr-5">Test Connection</vscode-button>
      <vscode-button id="save-connection">Save</vscode-button>
    </div>
    <div id="error-message-container" class="d-none">
        <div class="icon error"><i class="codicon codicon-warning"></i></div>
        <pre id="error-message"></pre>
    </div>
    <div id="success-message-container" class="d-none">
        <div class="icon success"><i class="codicon codicon-pass"></i></div>
        <pre id="success-message"></pre>
    </div>
    <vscode-progress-ring id="loading" class="d-none"></vscode-progress-ring>
    `
}