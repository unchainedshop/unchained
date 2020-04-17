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

WorkQueue.attachSchema(
  new SimpleSchema(
    {
      started: { type: Date, index: true },
      finished: Date,
      scheduled: { type: Date, index: true, required: true },
      priority: { type: Number, index: true },
      type: { type: String, index: true, required: true },
      input: { type: Object, blackbox: true },
      result: { type: Object, blackbox: true },
      error: { type: Object, blackbox: true },
      success: Boolean,
      retries: { type: Number, defaultValue: 20 },
      worker: String,
      original: { type: String, index: true },
      timeout: Number,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);
