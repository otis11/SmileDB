import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodeDivider, vsCodeDropdown, vsCodeOption, vsCodePanelTab, vsCodePanelView, vsCodePanels, vsCodeProgressRing, vsCodeTextField } from "@vscode/webview-ui-toolkit"
import { AllowedOrderByMethod, PoolConnectionAuthenticationMethod, PoolConnectionConfig, PoolConnectionConnectionMethod } from "../../../types"

provideVSCodeDesignSystem().register(
    vsCodeButton(),
    vsCodeProgressRing(),
    vsCodeTextField(),
    vsCodeCheckbox(),
    vsCodeDivider(),
    vsCodePanelTab(),
    vsCodePanelView(),
    vsCodePanels(),
    vsCodeOption(),
    vsCodeDropdown(),
)

// @ts-expect-error
const vscode = acquireVsCodeApi()
const testConnectionButton = document.getElementById("test-connection")
const saveConnectionButton = document.getElementById("save-connection")
const testConnectionLoadingElement = document.getElementById('loading')
const errorMessageElement = document.getElementById("error-message")
const errorMessageContainerElement = document.getElementById("error-message-container")
const successMessageElement = document.getElementById("success-message")
const successMessageContainerElement = document.getElementById("success-message-container")
const inputName = document.getElementById("name") as HTMLInputElement
const inputHost = document.getElementById("host") as HTMLInputElement
const inputPort = document.getElementById("port") as HTMLInputElement
const inputUsername = document.getElementById("user") as HTMLInputElement
const inputPassword = document.getElementById("password") as HTMLInputElement
const inputSaveAuthentication = document.getElementById("save-authentication") as HTMLInputElement
const inputDatabase = document.getElementById("database") as HTMLInputElement
const inputGlobal = document.getElementById("global") as HTMLInputElement
const inputReadonly = document.getElementById("readonly") as HTMLInputElement
const inputStayAliveInSeconds = document.getElementById('stay-alive-in-seconds') as HTMLInputElement
const inputTrustServerCertificate = document.getElementById('trust-server-certificate') as HTMLInputElement
const connectionMethodSelectElement = document.getElementById('connection-method-select') as HTMLInputElement
const advancedOrderByMethodSelectElement = document.getElementById('advanced-order-by-method-select') as HTMLInputElement
const connecitonFileElement = document.getElementById('connection-file') as HTMLInputElement
const connecitonHostPortDatabaseElement = document.getElementById('connection-host-port-database') as HTMLInputElement
const authenticationMethodSelectElement = document.getElementById('authentication-method-select') as HTMLInputElement
const authenticationUsernamePassword = document.getElementById('authentication-username-password') as HTMLInputElement
const viewConnectionElement = document.getElementById('view-connection') as HTMLInputElement
const viewAuthenticationElement = document.getElementById('view-authentication') as HTMLInputElement
const fileElement = document.getElementById('file') as HTMLInputElement
const fileIconElement = document.getElementById('file-icon') as HTMLInputElement

let isNameChangedManual = false
let activeConnectionMethod: PoolConnectionConnectionMethod
let activeAuthenticationMethod: PoolConnectionAuthenticationMethod
let updateName: () => void

function onConnectionConfigLoad(connectionConfig: PoolConnectionConfig) {
    inputGlobal.checked = connectionConfig.advanced.global
    inputReadonly.checked = connectionConfig.advanced.readonly
    isNameChangedManual = !!connectionConfig.name
    activeConnectionMethod = connectionConfig.connection.allowedMethods[0]
    activeAuthenticationMethod = connectionConfig.authentication.allowedMethods[0]
    updateConnectionMethodDisplayed()
    updateAuthenticationMethodDisplayed()

    updateName = () => {
        if (isNameChangedManual) {
            return
        }

        if (activeConnectionMethod === 'hostPortDatabase') {
            inputName.value = inputDatabase.value + "@" + inputHost.value
        } else if (activeConnectionMethod === 'file') {
            inputName.value = fileElement.value.slice(fileElement.value.lastIndexOf('/') + 1)
        } else {
            inputName.value = connectionConfig.moduleName
        }
    }

    advancedOrderByMethodSelectElement.value = connectionConfig.advanced.activeOrderByMethod

    inputHost.oninput = updateName
    inputDatabase.oninput = updateName
    inputName.oninput = () => isNameChangedManual = true

    testConnectionButton?.addEventListener('click', () => {
        hideErrorAndSuccessMessage()
        testConnectionLoadingElement?.classList.remove('d-none')
        vscode.postMessage({
            command: 'connection.execute.test',
            payload: getEditedConnectionConfig()
        })
    })

    saveConnectionButton?.addEventListener('click', () => {
        hideErrorAndSuccessMessage()
        testConnectionLoadingElement?.classList.remove('d-none')
        vscode.postMessage({
            command: 'connection.execute.save',
            payload: getEditedConnectionConfig(),
        })
    })

    fileIconElement?.addEventListener('click', () => {
        hideErrorAndSuccessMessage()
        vscode.postMessage({
            command: 'file.open',
        })
    })

    connectionMethodSelectElement.addEventListener('input', async () => {
        await new Promise(resolve => setTimeout(resolve, 1))
        activeConnectionMethod = connectionMethodSelectElement.value as PoolConnectionConnectionMethod
        updateConnectionMethodDisplayed()
    })

    authenticationMethodSelectElement.addEventListener('input', async () => {
        await new Promise(resolve => setTimeout(resolve, 1))
        activeAuthenticationMethod = authenticationMethodSelectElement.value as PoolConnectionAuthenticationMethod
        updateAuthenticationMethodDisplayed()
    })

    function updateAuthenticationMethodDisplayed() {
        const authenticationSection = viewAuthenticationElement.querySelectorAll('.authentication')
        for (let i = 0; i < authenticationSection.length; i++) {
            authenticationSection[i].classList.add('d-none')
        }
        if (activeAuthenticationMethod === 'usernamePassword') {
            authenticationUsernamePassword.classList.remove('d-none')
        }
    }

    function updateConnectionMethodDisplayed() {
        const connectionSections = viewConnectionElement.querySelectorAll('.connection')
        for (let i = 0; i < connectionSections.length; i++) {
            connectionSections[i].classList.add('d-none')
        }
        if (activeConnectionMethod === 'hostPortDatabase') {
            connecitonHostPortDatabaseElement.classList.remove('d-none')
        }
        if (activeConnectionMethod === 'file') {
            connecitonFileElement.classList.remove('d-none')
        }
    }

    function getAuthenticationData() {
        if (activeAuthenticationMethod === 'usernamePassword') {
            return {
                username: inputUsername.value,
                password: inputPassword.value,
            }
        }
        return {}
    }

    function getConnectionData() {
        if (activeConnectionMethod === 'hostPortDatabase') {
            return {
                host: inputHost.value,
                database: inputDatabase.value,
                port: parseInt(inputPort.value),
            }
        }
        else if (activeConnectionMethod === 'file') {
            return {
                file: fileElement.value
            }
        }
        return {}
    }

    function getEditedConnectionConfig(): PoolConnectionConfig {
        return {
            name: inputName.value,
            id: connectionConfig.id,
            moduleName: connectionConfig.moduleName,
            connection: {
                activeMethod: activeConnectionMethod,
                allowedMethods: connectionConfig.connection.allowedMethods,
                ...getConnectionData()
            },
            authentication: {
                activeMethod: activeAuthenticationMethod,
                allowedMethods: connectionConfig.authentication.allowedMethods,
                saveAuthentication: inputSaveAuthentication.checked,
                ...getAuthenticationData()
            },
            advanced: {
                global: inputGlobal.checked,
                readonly: inputReadonly.checked,
                trustServerCertificate: inputTrustServerCertificate.checked,
                stayAliveInSeconds: parseInt(inputStayAliveInSeconds.value),
                allowedOrderByMethods: connectionConfig.advanced.allowedOrderByMethods,
                activeOrderByMethod: advancedOrderByMethodSelectElement.value as AllowedOrderByMethod,
                filter: connectionConfig.advanced.filter,
            },
        }
    }

    setTimeout(updateName, 200)
}

function showErrorMessage(message: string) {
    errorMessageContainerElement?.classList.remove('d-none')
    successMessageContainerElement?.classList.add("d-none")
    if (errorMessageElement) {
        errorMessageElement.innerText = message
    }
}

function showSuccessMessage(message: string) {
    successMessageContainerElement?.classList.remove('d-none')
    errorMessageContainerElement?.classList.add("d-none")
    if (successMessageElement) {
        successMessageElement.innerText = message
    }
}

function hideErrorAndSuccessMessage() {
    errorMessageContainerElement?.classList.add("d-none")
    successMessageContainerElement?.classList.add("d-none")
}

window.addEventListener('message', event => {
    const message = event.data
    testConnectionLoadingElement?.classList.add('d-none')

    if (message.command === "connection.execute.save.result" ||
        message.command === "connection.execute.test.result") {
        const time = (message.payload.activeConnections?.timeInMilliseconds || 0) + 'ms'
        showSuccessMessage(message.payload.message + '\nPing: ' + time)
    }

    if (message.command === "connection.execute.save.error" ||
        message.command === "connection.execute.test.error") {
        showErrorMessage(message.payload.message)

    }

    if (message.command === 'file.open.result') {
        fileElement.value = message.payload.path
        updateName()
    }

    if (message.command === "load.connectionConfig") {
        onConnectionConfigLoad(message.payload)
    }
})

vscode.postMessage({
    command: 'load.connectionConfig'
})
