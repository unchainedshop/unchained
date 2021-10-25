import { Db } from 'unchained-core-types';
import { Log } from 'unchained-core-types/lib/logs';

const ONE_DAY_IN_SECONDS = 86400;

export const LogsCollection = async (db: Db) => {
  const Logs = db.collection<Log>('logs');

  await Logs.createIndex(
    { created: -1 },
    { expireAfterSeconds: 2 * ONE_DAY_IN_SECONDS }
  );

  return Logs;
};
