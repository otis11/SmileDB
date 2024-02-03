import { ExtensionContext } from "vscode"
import { Module, ModuleName, ConnectionClientModule } from "../types"

const modules: Module[] = []
const connectionClientModules: ConnectionClientModule[] = []

export function installModule(module: Module, context: ExtensionContext) {
    modules.push(module)
    module.install(context)
}

export function installConnectionClientModule(module: ConnectionClientModule, context: ExtensionContext) {
    connectionClientModules.push(module)
    module.install(context)
}

export function getModule(name: ModuleName) {
    const module = modules.filter(module => module.name === name)[0]
    if (!module) {
        throw Error('Module with name "' + name + '" not found.')
    }
    return module
}

export function getConnectionClientModule(name: ModuleName) {
    const module = connectionClientModules.filter(module => module.name === name)[0]
    if (!module) {
        throw Error('Database Module with name "' + name + '" not found.')
    }
    return module
}

export function getConnectionClientModules() {
    return connectionClientModules
}

export function getModules() {
    return modules
}
