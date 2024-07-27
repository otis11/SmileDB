import { DatabaseObjectDelete, DatabaseObjectInsert, DatabaseObjectUpdate, QueryResultRow, SQLQueryBuildConfig } from './types'

export function createSQLWhereStatements(row: QueryResultRow, config: SQLQueryBuildConfig) {
    return "WHERE " + Object.keys(row).map(field => {
        const sqlValue = convertJsToSql(row[field], config)

        // null check
        if (row[field] === null) {
            return `${field} IS NULL`
        }

        return `${field} = ${sqlValue}`
    }).join(' AND ')
}

export function createSQLSetStatements(row: QueryResultRow, config: SQLQueryBuildConfig) {
    return "SET " + Object.keys(row).map(field =>
        `${field} = ${convertJsToSql(row[field], config)}`
    ).join(',')
}

export function convertJsToSql(val: any, config: SQLQueryBuildConfig) {
    const stringWrap = config.stringWrap ? config.stringWrap : '\''
    if (val === null) {
        return 'NULL'
    }
    if (typeof val === 'number') {
        return val
    }
    return `${stringWrap}${val}${stringWrap}`
}

export function buildSQLQueryInsertions(insertions: DatabaseObjectInsert, config: SQLQueryBuildConfig) {
    const queries: string[] = []
    for (let i = 0; i < insertions.insertions.length; i++) {
        const insertion = insertions.insertions[i]
        const queryStart = `INSERT INTO ${config.dbId}`
        const queryFields = ` (${Object.keys(insertion).join(', ')})`
        const queryValues = ` VALUES (${Object.keys(insertion).map(fieldName => convertJsToSql(insertion[fieldName], config))})`
        queries.push(queryStart + queryFields + queryValues)
    }
    return queries
}

export function buildSQLQueryDeletions(deletions: DatabaseObjectDelete[], config: SQLQueryBuildConfig) {
    const queries = []
    for (let i = 0; i < deletions.length; i++) {
        const whereStatements = createSQLWhereStatements(deletions[i].where, config)
        queries.push(`DELETE FROM ${config.dbId}
${whereStatements}`)
    }
    return queries
}

export function buildSQLQueryUpdates(changes: DatabaseObjectUpdate[], config: SQLQueryBuildConfig) {
    const queries = []
    for (let i = 0; i < changes.length; i++) {
        const whereStatements = createSQLWhereStatements(changes[i].where, config)
        const setStatements = createSQLSetStatements(changes[i].update, config)
        queries.push(`UPDATE ${config.dbId}
${setStatements}
${whereStatements}`)
    }
    return queries
}
