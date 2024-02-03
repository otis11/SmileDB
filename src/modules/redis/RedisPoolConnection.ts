import Redis from 'ioredis'
import { DatabaseObjectDelete, DatabaseObjectInsert, DatabaseObjectUpdate, PoolConnection, PoolConnectionConfig, QueryConfigFetch, QueryResultField, QueryResultRow, Timer, jsonStringify } from "../core"

const REDIS_START_COMMAND_KEYWORDS = [
    'set', 'get', 'del', 'hset', 'hget', 'scan', 'select',
    'append', 'bitcount', 'bitfield', 'bitop', 'bitpos', 'decr', 'decrby', 'getbit', 'getrange', 'getset', 'incr', 'incrby', 'incrbyfloat', 'mget', 'mset', 'msetnx', 'psetex', 'setbit', 'setex', 'setnx', 'setrange', 'strlen',
    'hdel', 'hexists', 'hgetall', 'hincrby', 'hincrbyfloat', 'hkeys', 'hlen', 'hmget', 'hmset', 'hsetnx', 'hvals', 'hscan',
    'blpop', 'brpop', 'brpoplpush', 'lindex', 'linsert', 'llen', 'lpop', 'lpush', 'lpushx', 'lrange', 'lrem', 'lset', 'ltrim', 'rpop', 'rpoplpush', 'rpush', 'rpushx',
    'sadd', 'scard', 'sdiff', 'sdiffstore', 'sinter', 'sinterstore', 'sismember', 'smembers', 'smove', 'spop', 'srandmember', 'srem', 'sunion', 'sunionstore', 'sscan',
    'zadd', 'zcard', 'zcount', 'zincrby', 'zinterstore', 'zlexcount', 'zrange', 'zrangebylex', 'zrevrangebylex', 'zrangebyscore', 'zrank', 'zrem', 'zremrangebylex', 'zremrangebyrank', 'zremrangebyscore', 'zrevrange', 'zrevrangebyscore', 'zrevrank', 'zscore', 'zunionstore', 'zscan',
    'del', 'dump', 'exists', 'expire', 'expireat', 'keys', 'migrate', 'move', 'object', 'persist', 'pexpire', 'pexpireat', 'pttl', 'randomkey', 'rename', 'renamenx', 'restore', 'sort', 'ttl', 'type', 'scan',
    'discard', 'exec', 'multi', 'unwatch', 'watch',
    'psubscribe', 'publish', 'pubsub', 'punsubscribe', 'subscribe', 'unsubscribe',
    'eval', 'evalsha', 'script',
    'auth', 'echo', 'ping', 'quit', 'select',
    'bgrewriteaof', 'bgsave', 'client', 'command', 'config', 'dbsize', 'debug', 'flushall', 'flushdb', 'info', 'lastsave', 'monitor', 'role', 'save', 'shutdown', 'slaveof', 'slowlog', 'sync', 'time'
]

const REDIS_TYPES = {
    hash: 'hash',
    string: 'string',
    list: 'list',
    set: 'set',
    zset: 'zset'
}

export class RedisPoolConnection implements PoolConnection {
    private keyTypeCache: Record<string, string> = {}
    private pool: Redis | null = null
    private isRedisConnected = false
    private readonly redisKeyForKey: string = 'Redis Key'
    private readonly redisKeyForValue = 'Redis Value'
    private readonly redisPlaceholderForDoubleQuote = 'PLACEHOLDER_FOR_DOUBLE_QUOTE'

    constructor(public config: PoolConnectionConfig) { }

    async closeConnection() {
        await this.pool?.quit()
    }

    async fetchTables() {
        // TODO
        return {
            rows: [],
            fields: [],
            stats: {
                timeInMilliseconds: 0,
            }
        }
    }

    async fetchDatabases() {
        const timer = new Timer()
        await this.connectToRedis()
        const queryResult = await this.pool?.call('CONFIG', 'GET', 'databases') as string[]
        const totalDatabases = parseInt(queryResult[1])
        const rows: QueryResultRow[] = []
        for (let i = 0; i < totalDatabases; i++) {
            rows.push({
                database: i
            })
        }
        // TODO
        return {
            rows,
            fields: [{
                name: 'database',
                type: '',
                flags: [],
            }],
            stats: {
                timeInMilliseconds: timer.stop(),
            }
        }
    }

    private async connectToRedis() {
        if (this.isRedisConnected) {
            return
        }

        const db = parseInt(this.config.connection.database || '0')
        this.pool = new Redis({
            db,
            port: this.config.connection.port,
            host: this.config.connection.host,
            username: this.config.authentication.username,
            password: this.config.authentication.password,
            retryStrategy: () => null
        })

        await new Promise((resolve, reject) => {
            this.pool?.on('error', (e) => {
                reject(e)
            })

            this.pool?.on('connect', () => {
                this.isRedisConnected = true
                resolve(null)
            })
        })
    }

    async testConnection() {
        const timer = new Timer()
        await this.connectToRedis()
        const info = await this.pool?.info()
        const versionRegex = new RegExp(/redis_version(.*)/)
        const osRegex = new RegExp(/os(.*)/)
        const versionMatch = info?.match(versionRegex)
        const osMatch = info?.match(osRegex)
        return {
            rows: [{
                version: (versionMatch ? versionMatch[0] : '') + '  ' + (osMatch ? osMatch[0] : ''),
            }],
            fields: [],
            stats: {
                timeInMilliseconds: timer.stop(),
            }
        }
    }

    buildQueriesDelete(deletions: DatabaseObjectDelete[]) {
        const singleDeleteQuery = 'DEL ' + deletions.map(deletion => deletion.where[this.redisKeyForKey]).join(' ')
        return [singleDeleteQuery]
    }

    buildQueriesFetch(queryConfig: QueryConfigFetch) {
        return [`SELECT ${queryConfig.database} SCAN ${queryConfig.page} COUNT ${queryConfig.pageResultsLimit}`]
    }

    buildQueriesInsert(insertions: DatabaseObjectInsert) {
        const queries = []
        for (let i = 0; i < insertions.insertions.length; i++) {
            queries.push(`SET "${insertions.insertions[i][this.redisKeyForKey]?.toString().replace(/"/g, this.redisPlaceholderForDoubleQuote)}" "${insertions.insertions[i][this.redisKeyForValue]?.toString().replace(/"/g, this.redisPlaceholderForDoubleQuote)}"`)
        }
        return queries
    }

    buildQueriesUpdate(changes: DatabaseObjectUpdate[]) {
        const queries = []
        for (let i = 0; i < changes.length; i++) {
            const key = `${changes[i].where[this.redisKeyForKey]?.toString().replace(/"/g, this.redisPlaceholderForDoubleQuote)}`
            const value = changes[i].update[this.redisKeyForValue] as string
            if (this.keyTypeCache[key] === REDIS_TYPES.string) {
                queries.push(`SET ${key} "${value?.toString().replace(/"/g, this.redisPlaceholderForDoubleQuote)}"`)
            }
            else if (this.keyTypeCache[key] === REDIS_TYPES.hash) {
                // incoming as json object {'key1': 'value1'}
                const object = JSON.parse(value)
                for (const hashKey of Object.keys(object)) {
                    queries.push(`HSET ${key} "${hashKey}" "${object[hashKey]?.toString().replace(/"/g, this.redisPlaceholderForDoubleQuote)}"`)
                }
            }
            else {
                // incoming as json array ["x", "y"]
                let addCommandKeyword = ''
                if (this.keyTypeCache[key] === REDIS_TYPES.list) {
                    addCommandKeyword = 'RPUSH'
                }
                if (this.keyTypeCache[key] === REDIS_TYPES.set) {
                    addCommandKeyword = 'SADD'
                }
                if (this.keyTypeCache[key] === REDIS_TYPES.zset) {
                    addCommandKeyword = 'ZADD'
                }
                const array = JSON.parse(value)
                // delete old set/array
                queries.push(`DEL ${key}`)

                // push all, zadd needs counting
                if (this.keyTypeCache[key] === REDIS_TYPES.zset) {
                    queries.push(`${addCommandKeyword} ${key} ${array.map((v: { toString: () => string; }, index: number) => (index + 1) + ' "' + v?.toString().replace(/"/g, this.redisPlaceholderForDoubleQuote) + '"').join(' ')}`)
                } else {
                    queries.push(`${addCommandKeyword} ${key} ${array.map((v: { toString: () => string; }) => '"' + v?.toString().replace(/"/g, this.redisPlaceholderForDoubleQuote) + '"').join(' ')}`)
                }
            }
        }
        return queries
    }

    async executeQuery(query: string) {
        const timer = new Timer()
        const result = await this.executeQueryString(query)
        return {
            fields: this.getQueryResultRedisFields(),
            rows: result.rows,
            stats: {
                rowCount: result.rowCount,
                timeInMilliseconds: timer.stop()
            }
        }
    }

    private async executeQueryString(query: string) {
        await this.connectToRedis()
        const rows: QueryResultRow[] = []
        const regex = /("[^"]+"|'[^']+'|\S+)/g
        const args = query.match(regex)
        if (args === null) {
            return {
                rows: [],
                rowCount: 0,
            }
        }
        const commands: string[][] = []
        for (const arg of args) {
            if (REDIS_START_COMMAND_KEYWORDS.includes(arg.toLowerCase())) {
                commands.push([])
            }
            commands.at(-1)?.push(arg.replace(/"/g, '').replace(new RegExp(this.redisPlaceholderForDoubleQuote, 'g'), '"'))
        }
        // doesnt seem to work correctly with multi
        //const result = await this.pool?.multi(commands).exec();
        let result: string[] = []
        for (const command of commands) {
            result = await this.pool?.call(command[0], ...command.slice(1)) as string[]
        }

        // custom queries, eg "get x" just returns "y" should be improved further at some point
        if (!Array.isArray(result) || !Array.isArray(result[1])) {
            return {
                rows: [{
                    [this.redisKeyForValue]: jsonStringify(result),
                    [this.redisKeyForKey]: 'result'
                }],
                rowCount: await this.pool?.dbsize() || 0,
            }
        }

        for (let i = 0; i < result[1].length; i++) {
            // TODO inefficient, there needs to be something better
            const key = result[1][i]
            const type = this.keyTypeCache[key] ? this.keyTypeCache[key] : await this.pool?.type(key)
            if (type) {
                this.keyTypeCache[key] = type
            }
            rows.push({
                [this.redisKeyForValue]: jsonStringify(await this.getRedisValue(key, type)),
                [this.redisKeyForKey]: result[1][i]
            })
        }
        return {
            rows,
            rowCount: await this.pool?.dbsize() || 0,
        }
    }

    private async getRedisValue(key: string, type: string | undefined) {
        if (type === REDIS_TYPES.string) {
            return this.pool?.get(key)
        }
        if (type === REDIS_TYPES.hash) {
            return this.pool?.hgetall(key)
        }
        if (type === REDIS_TYPES.list) {
            return this.pool?.lrange(key, 0, -1)
        }
        if (type === REDIS_TYPES.set) {
            return this.pool?.smembers(key)
        }
        if (type === REDIS_TYPES.zset) {
            return this.pool?.zrange(key, 0, -1)
        }
    }

    private getQueryResultRedisFields(): QueryResultField[] {
        return [
            {
                name: this.redisKeyForKey,
                type: 'REDIS_KEY',
                flags: ['primary'],
            },
            {
                name: this.redisKeyForValue,
                type: 'unkown',
                flags: [],
            }
        ]
    }

    async executeQueriesAndFetch(queries: string[], queryConfig: QueryConfigFetch) {
        const timer = new Timer()
        for (let i = 0; i < queries.length; i++) {
            await this.executeQueryString(queries[i])
        }
        const fetchQueries = this.buildQueriesFetch(queryConfig)
        const result = await this.executeQueryString(fetchQueries[0])
        return {
            fields: this.getQueryResultRedisFields(),
            rows: result.rows,
            stats: {
                rowCount: result.rowCount,
                timeInMilliseconds: timer.stop()
            }
        }
    }
}
