import { LogsSchema } from './LogsSchema';
const ONE_DAY_IN_SECONDS = 86400;

export const LogsCollection = (db) => {
  const Logs = new db.Collection('logs');
  Logs.attachSchema(LogsSchema);

  Logs.createIndex(
    { created: -1 },
    { expireAfterSeconds: 2 * ONE_DAY_IN_SECONDS }
  );

  return Logs;
};
