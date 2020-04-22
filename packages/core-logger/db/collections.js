import { Mongo } from 'meteor/mongo';

export const Logs = new Mongo.Collection('logs');

const ONE_DAY_IN_SECONDS = 86400;

Logs.rawCollection().createIndex(
  {
    created: -1,
  },
  { expireAfterSeconds: 2 * ONE_DAY_IN_SECONDS }
);

export default Logs;
