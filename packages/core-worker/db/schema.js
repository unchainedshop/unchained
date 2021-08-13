/* eslint-disable import/prefer-default-export */
import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { WorkQueue } from './collections';

export const WorkStatus = {
  NEW: 'NEW',
  ALLOCATED: 'ALLOCATED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  DELETED: 'DELETED',
};

const ONE_DAY_IN_SECONDS = 86400;

WorkQueue.attachSchema(
  new SimpleSchema(
    {
      started: Date,
      finished: Date,
      scheduled: { type: Date, required: true },
      priority: { type: Number, required: true },
      type: { type: String, required: true },
      input: { type: Object, blackbox: true },
      result: { type: Object, blackbox: true },
      error: { type: Object, blackbox: true },
      success: Boolean,
      retries: { type: Number, required: true },
      worker: String,
      originalWorkId: { type: String },
      timeout: Number,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  WorkQueue.rawCollection().createIndex(
    {
      created: -1,
    },
    { expireAfterSeconds: 30 * ONE_DAY_IN_SECONDS }
  );
  WorkQueue.rawCollection().createIndex({ started: -1 });
  WorkQueue.rawCollection().createIndex({ finished: 1 });
  WorkQueue.rawCollection().createIndex({ scheduled: 1 });
  WorkQueue.rawCollection().createIndex({ priority: -1 });
  WorkQueue.rawCollection().createIndex({ type: 1 });
  WorkQueue.rawCollection().createIndex({ originalWorkId: 1 });
};
