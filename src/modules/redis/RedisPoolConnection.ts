import { DatabaseObjectDelete, DatabaseObjectInsert, DatabaseObjectUpdate, PoolConnection, PoolConnectionConfig, QueryConfigDelete, QueryConfigFetch, QueryConfigInsert, QueryConfigUpdate, QueryResult, QueryResultField, QueryResultRow, Timer } from "../core";
import Redis from 'ioredis';

export class RedisPoolConnection implements PoolConnection {
    private pool: Redis | null = null;
    private isRedisConnected = false;
    private readonly redisKeyForKey: string = 'Redis Key';
    private readonly redisKeyForValue = 'Redis Value';

    constructor(public config: PoolConnectionConfig) { }

    async closeConnection() {
        await this.pool?.quit();
    }

    async fetchTables() {
        // TODO
        return {
            rows: [],
            fields: [],
            stats: {
                timeInMilliseconds: 0,
            }
        };
    }

    async fetchDatabases() {
        const timer = new Timer();
        await this.connectToRedis();
        const queryResult = await this.pool?.call('CONFIG', 'GET', 'databases') as string[];
        const totalDatabases = parseInt(queryResult[1]);
        const rows: QueryResultRow[] = [];
        for (let i = 0; i < totalDatabases; i++) {
            rows.push({
                database: i
            });
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
        };
    }

    private async connectToRedis() {
        if (this.isRedisConnected) {
            return;
        }

        const db = parseInt(this.config.connection.database || '0');
        this.pool = new Redis({
            db,
            port: this.config.connection.port,
            host: this.config.connection.host,
            username: this.config.authentication.username,
            password: this.config.authentication.password,
            retryStrategy: () => null
        });

        await new Promise((resolve, reject) => {
            this.pool?.on('error', (e) => {
                reject(e);
            });

            this.pool?.on('connect', () => {
                this.isRedisConnected = true;
                resolve(null);
            });
        });
    }

    async testConnection() {
        const timer = new Timer();
        await this.connectToRedis();
        const info = await this.pool?.info();
        const versionRegex = new RegExp(/redis_version(.*)/);
        const osRegex = new RegExp(/os(.*)/);
        const versionMatch = info?.match(versionRegex);
        const osMatch = info?.match(osRegex);
        return {
            rows: [{
                version: (versionMatch ? versionMatch[0] : '') + '  ' + (osMatch ? osMatch[0] : ''),
            }],
            fields: [],
            stats: {
                timeInMilliseconds: timer.stop(),
            }
        };
    }

    buildQueriesDelete(deletions: DatabaseObjectDelete[], queryConfig: QueryConfigDelete) {
        const singleDeleteQuery = 'DEL ' + deletions.map(deletion => deletion.where[this.redisKeyForKey]).join(' ');
        return [singleDeleteQuery];
    }

    buildQueriesFetch(queryConfig: QueryConfigFetch) {
        return [`SELECT ${queryConfig.database}
SCAN ${queryConfig.page}
COUNT ${queryConfig.pageResultsLimit}`];
    }

    buildQueriesInsert(insertions: DatabaseObjectInsert, queryConfig: QueryConfigInsert) {
        const queries = [];
        for (let i = 0; i < insertions.insertions.length; i++) {
            queries.push(`SET "${insertions.insertions[i][this.redisKeyForKey]}" "${insertions.insertions[i][this.redisKeyForValue]}"`);
        }
        return queries;
    }

    buildQueriesUpdate(changes: DatabaseObjectUpdate[], queryConfig: QueryConfigUpdate) {
        const queries = [];
        for (let i = 0; i < changes.length; i++) {
            queries.push(`SET "${changes[i].where[this.redisKeyForKey]}" "${changes[i].update[this.redisKeyForValue]}"`);
        }
        return queries;
    }

    async executeQuery(query: string) {
        await this.executeQueryString(query);
        // TODO
        return {
            rows: [],
            fields: [],
            stats: {
                timeInMilliseconds: 0,
            }
        };
    }

    private async executeQueryString(query: string) {
        await this.connectToRedis();
        const selectMatch = query.match(/SELECT (.*)/);
        const scanMatch = query.match(/SCAN (.*)/);
        const countMatch = query.match(/COUNT (.*)/);
        const setMatch = query.match(/SET (.*)/);
        const deleteMatch = query.match(/DEL (.*)/);
        let rows = [];
        if (selectMatch) {
            await this.pool?.select(selectMatch[1]);
        }

        if (scanMatch) {
            let cursor = scanMatch[1];
            const count = countMatch ? parseInt(countMatch[1]) : 100;
            const result = await this.pool?.scan(cursor, 'MATCH', '*', 'COUNT', count) as any;
            for (let i = 0; i < result[1].length; i++) {
                rows.push({
                    [this.redisKeyForValue]: await this.pool?.get(result[1][i]),
                    [this.redisKeyForKey]: result[1][i]
                });
            }
        }

        if (setMatch) {
            const mtch = setMatch[1];
            const key = mtch.slice(1, mtch.indexOf('" "'));
            const value = mtch.slice(mtch.indexOf('" "') + 3, mtch.length - 1);
            await this.pool?.set(key, value);
        }

        if (deleteMatch) {
            const keysToDelete = deleteMatch[1].split(' ');
            this.pool?.del(keysToDelete);
        }

        const rowCount = await this.pool?.dbsize() || 0;
        return {
            rows,
            rowCount
        };
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
        ];
    }

    async executeQueriesAndFetch(queries: string[], queryConfig: QueryConfigFetch) {
        const timer = new Timer();
        for (let i = 0; i < queries.length; i++) {
            await this.executeQueryString(queries[i]);
        }
        const fetchQueries = this.buildQueriesFetch(queryConfig);
        const result = await this.executeQueryString(fetchQueries[0]);
        return {
            fields: this.getQueryResultRedisFields(),
            rows: result.rows,
            stats: {
                rowCount: result.rowCount,
                timeInMilliseconds: timer.stop()
            }
        };
    }
}
