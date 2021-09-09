import { LogsSchema } from './logs.schema';
const ONE_DAY_IN_SECONDS = 86400;

export const configureLogsCollection = (db) => {
  const Logs = new db.Collection('logs');
  Logs.attachSchema(LogsSchema);

  Logs.rawCollection().createIndex(
    {
      created: -1,
    },
    { expireAfterSeconds: 2 * ONE_DAY_IN_SECONDS }
  );

  return Logs;
};
