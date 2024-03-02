import { identifier } from '..'
import { getStorage } from '../../../global'
import type { DatabaseQuery, PoolConnectionConfig } from '../types'

export function getQueriesForConfig(config: PoolConnectionConfig) {
    const storage = getStorage()
    return (storage.get(identifier(config)) || []) as DatabaseQuery[]
}

export function storeQueryForConfig(query: DatabaseQuery, config: PoolConnectionConfig) {
    const storage = getStorage()
    const id = identifier(config)
    let queries = storage.get(id) as DatabaseQuery[]
    if (!queries) {
        queries = []
    }
    if (queries.find(q => q.name === query.name)) {
        throw Error('Name already exists.')
    }
    queries.push(query)
    storage.store(identifier(config), queries)
}

export function deleteQueryForConfig(query: DatabaseQuery, config: PoolConnectionConfig) {
    const storage = getStorage()
    const id = identifier(config)
    const queries = storage.get(id) as DatabaseQuery[]
    if (!queries) {
        return // no queries for id
    }
    storage.store(identifier(config), queries.filter(q => q.name !== query.name))
}
