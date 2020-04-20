/* eslint-disable import/prefer-default-export */
import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';
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
      priority: { type: Number, index: true, required: true },
      type: { type: String, index: true, required: true },
      input: { type: Object, blackbox: true },
      result: { type: Object, blackbox: true },
      error: { type: Object, blackbox: true },
      success: Boolean,
      retries: { type: Number, required: true },
      worker: String,
      originalWorkId: { type: String, index: true },
      timeout: Number,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

Migrations.add({
  version: 20200420,
  name: 'original to originalWorkId',
  up() {
    WorkQueue.update(
      {},
      {
        $rename: {
          original: 'originalWorkId',
        },
      },
      { bypassCollection2: true, multi: true }
    );
  },
  down() {
    WorkQueue.update(
      {},
      {
        $rename: {
          originalWorkId: 'original',
        },
      },
      { bypassCollection2: true, multi: true }
    );
  },
});

export default () => {
  Meteor.startup(() => {
    Migrations.migrateTo('latest');
  });
};
