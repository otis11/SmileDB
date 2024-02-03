export enum LogLevel {
    debug = 0,
    info = 1,
    warn = 2,
    error = 3
}

let logLevel: LogLevel = LogLevel.debug

export function setLogLevel(level: LogLevel) {
    logLevel = level
}

function log(logLevel: LogLevel, ...args: any[]) {
    if (logLevel >= logLevel) {
        console.log(
            getLogLevelColor(logLevel) + LogLevel[logLevel].toUpperCase() + ' \x1b[0m',
            ...args
        )
    }
}

function getLogLevelColor(logLevel: LogLevel) {
    if (logLevel === LogLevel.info) {
        // blue
        return '\x1b[34m '
    }
    if (logLevel === LogLevel.warn) {
        // yellow
        return '\x1b[33m '
    }
    if (logLevel === LogLevel.error) {
        // red
        return '\x1b[31m '
    }
    // gray, debug
    return '\x1b[90m'
}

export function logDebug(...args: any[]) {
    log(LogLevel.debug, ...args)
}

export function logInfo(...args: any[]) {
    log(LogLevel.info, ...args)
}

export function logWarn(...args: any[]) {
    log(LogLevel.warn, ...args)
}

export function logError(...args: any[]) {
    log(LogLevel.error, ...args)
}


