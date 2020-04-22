import { Mongo } from 'meteor/mongo';

export const Logs = new Mongo.Collection('logs');

const twoDaysInSeconds = 172800;

Logs.rawCollection().createIndex(
  {
    created: -1,
  },
  { expireAfterSeconds: twoDaysInSeconds }
);

export default Logs;
