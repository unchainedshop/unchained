import { Mongo } from 'meteor/mongo';

export const WorkQueue = new Mongo.Collection('work_queue');

const ONE_DAY_IN_SECONDS = 86400;

WorkQueue.rawCollection().createIndex(
  {
    created: -1,
  },
  { expireAfterSeconds: 30 * ONE_DAY_IN_SECONDS }
);

export default WorkQueue;
