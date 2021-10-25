import { Mongo } from 'meteor/mongo';
import { Db } from 'mongodb';
declare const initDb: ({ dbName }: {
    dbName: string;
}) => Db;
declare const db: typeof Mongo;
export { db, initDb };
