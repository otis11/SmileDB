import { ConnectionClientModule, Module, ModuleName } from "../types"

const modules: Module[] = []
const connectionClientModules: ConnectionClientModule[] = []

export function installModule(module: Module) {
    modules.push(module)
    if (module.install) {
        module.install()
    }
}

export function installConnectionClientModule(module: ConnectionClientModule) {
    connectionClientModules.push(module)
    if (module.install) {
        module.install()
    }
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
