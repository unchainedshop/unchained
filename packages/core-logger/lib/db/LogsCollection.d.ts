import { Db } from 'unchained-core-types';
import { Log } from 'unchained-core-types/lib/logs';
export declare const LogsCollection: (db: Db) => Promise<import("mongodb").Collection<Log>>;
