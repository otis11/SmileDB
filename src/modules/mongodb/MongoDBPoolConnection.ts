import { QueryResultRow } from "pg";
import { Timer, PoolConnection, PoolConnectionConfig, QueryConfigFetch, QueryConfigInsert, QueryConfigDelete, QueryConfigUpdate, DatabaseObjectUpdate, DatabaseObjectDelete, QueryResultFieldFlag, QueryResultField, QueryResult, DatabaseObjectInsert } from "../core";
import { MongoClient, ObjectId } from 'mongodb';

export class MongoDBPoolConnection implements PoolConnection {
    private client: MongoClient;
    private mdbObjectId = ObjectId;


    constructor(public config: PoolConnectionConfig) {
        // mongodb://[[username][:password]@][host][:port][?option1&option2...]
        let userCreds = `${this.config.authentication.username}:${this.config.authentication.password}@`;
        if (userCreds === ":@") {
            userCreds = "";
        }
        this.client = new MongoClient(`mongodb://${userCreds}${this.config.connection.host}:${this.config.connection.port}`);
    }

    async closeConnection() {
        await this.client?.close();
    }
    async testConnection() {
        const timer = new Timer();
        const info = await this.client.db().admin().serverStatus();
        return {
            fields: [],
            rows: [{
                version: info.process + ' ' + info.version,
            }],
            stats: {
                timeInMilliseconds: timer.stop()
            }
        };
    }

    async fetchDatabases() {
        const timer = new Timer();
        // only works with admin creds, add option without admin creds
        const queryResult = await this.client?.db().admin().listDatabases();
        return {
            fields: [{
                name: 'name',
                type: '',
                flags: [],
            }],
            rows: queryResult.databases,
            stats: {
                timeInMilliseconds: timer.stop()
            }
        };
    }

    async fetchTables(): Promise<QueryResult> {
        const timer = new Timer();
        const result = (await this.client?.db(this.config.connection.database).listCollections().toArray());
        return {
            fields: [{
                name: 'name',
                type: '',
                flags: [],
            }],
            rows: result,
            stats: {
                timeInMilliseconds: timer.stop()
            }
        };
    }

    buildQueriesFetch(queryConfig: QueryConfigFetch) {
        let orderBy = '';
        if (queryConfig.orderBy) {
            const direction = queryConfig.orderBy.direction === 'ascending' ? 1 : -1;
            orderBy += `.sort({ ${queryConfig.orderBy.field}: ${direction} })`;
        }
        let filter = '';
        if (queryConfig.filterString) {
            filter = `.filter(${queryConfig.filterString})`;
        }
        return [`db("${queryConfig.database}").collection("${queryConfig.table}").find({})${filter}${orderBy}.skip(${queryConfig.page * queryConfig.pageResultsLimit}).limit(${queryConfig.pageResultsLimit}).toArray()`];
    }

    buildQueriesInsert(insertions: DatabaseObjectInsert, queryConfig: QueryConfigInsert) {
        return [`db("${queryConfig.database}").collection("${queryConfig.table}").insertMany(${JSON.stringify(insertions.insertions)})`];
    }

    buildQueriesDelete(deletions: DatabaseObjectDelete[], queryConfig: QueryConfigDelete) {
        let filterObject: string = '{ _id: { $in: [';
        for (let i = 0; i < deletions.length; i++) {
            filterObject += `new this.mdbObjectId("${deletions[i].where._id}"),`;
            // remember for later, valid query which the user would use would be
            // db.users, so its db.<queryConfig.table>...
        }
        filterObject += ']}}';
        return [`db("${queryConfig.database}").collection("${queryConfig.table}").deleteMany(${filterObject})`];
    }

    buildQueriesUpdate(changes: DatabaseObjectUpdate[], queryConfig: QueryConfigUpdate) {
        const queries: string[] = [];
        for (let i = 0; i < changes.length; i++) {
            const filterObjectId = `{ _id: new this.mdbObjectId("${changes[i].where._id}") }`;
            const update = `{ $set: ${JSON.stringify(changes[i].update)} }`;
            // remember for later, valid query which the user would use would be
            // db.users, so its db.<queryConfig.table>...
            queries.push(`db("${queryConfig.database}").collection("${queryConfig.table}").updateMany(${filterObjectId}, ${update})`);
        }
        return queries;
    }

    async executeQuery(query: string) {
        const timer = new Timer();
        let result = await eval("this.client." + query);
        if (!Array.isArray(result)) {
            result = [{ value: result }];
        }
        return {
            fields: this.createQueryResultFields(result[0] || {}),
            // @ts-ignore
            rows: result.map(o => this.convertFieldValuesToString(o)),
            stats: {
                timeInMilliseconds: timer.stop(),
            }
        };
    }

    async executeQueriesAndFetch(queries: string[], config: QueryConfigFetch) {
        const timer = new Timer();
        const promises = [];
        for (let i = 0; i < queries.length; i++) {
            promises.push(eval("this.client." + queries[i]));
        }
        await Promise.all(promises);
        const fetchQueries = this.buildQueriesFetch(config);
        const result = await eval("this.client." + fetchQueries[0]);
        const rowCount = await this.fetchTotalRows(config);
        return {
            fields: this.createQueryResultFields(result[0] || {}),
            // @ts-ignore
            rows: result.map(o => this.convertFieldValuesToString(o)),
            stats: {
                timeInMilliseconds: timer.stop(),
                rowCount,
            }
        };
    }

    convertFieldValuesToString(field: any): string | number | null {
        Object.keys(field).map(key => {
            if (field[key]?._bsontype === "ObjectId") {
                // document id
                field[key] = field[key].toString();
            }
            else if (typeof field[key] === "object") {
                field[key] = JSON.stringify(field[key]);
            }
        });
        return field;
    }

    private async fetchTotalRows(queryConfig: QueryConfigFetch) {
        let filter = '';
        if (queryConfig.filterString) {
            filter = `.filter(${queryConfig.filterString})`;
        }
        // TODO improve, .count() is deprecated, works for now
        return await eval(`this.client.db("${queryConfig.database}").collection("${queryConfig.table}").find({})${filter}.count()`);
    }

    private createQueryResultField(field: string, value: any): QueryResultField {
        const flags: QueryResultFieldFlag[] = [];
        if (field === '_id') {
            flags.push('primary');
        }
        return {
            name: field,
            type: typeof value,
            flags,
        };
    }

    private createQueryResultFields(row: QueryResultRow) {
        return Object.keys(row).map(field => this.createQueryResultField(field, row[field]));
    }
};
