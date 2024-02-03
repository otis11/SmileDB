//! do not import anything from vscode, it would break webviews

export type ShortcutRegister = {
    keys: {
        [key: string]: boolean
    },
    callback: () => any
}

export function registerShortcuts(shortcutRegisters: ShortcutRegister[]) {
    const pressedKeys: { [key: string]: boolean } = {}
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        pressedKeys[e.key] = true
        const shortcutRegister = shortcutRegisters.find(register => {
            return Object.keys(register.keys).filter(key => !pressedKeys[key]).length === 0
        })
        if (shortcutRegister) {
            shortcutRegister.callback()
        }
    })

    document.addEventListener('keyup', (e: KeyboardEvent) => {
        pressedKeys[e.key] = false
    })
}
