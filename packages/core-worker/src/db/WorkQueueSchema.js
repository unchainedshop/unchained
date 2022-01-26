import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const WorkQueueSchema = new SimpleSchema(
  {
    finished: Date,
    originalWorkId: { type: String },
    priority: { type: Number, required: true },
    retries: { type: Number, required: true },
    scheduled: { type: Date, required: true },
    started: Date,
    success: Boolean,
    timeout: Number,
    type: { type: String, required: true },
    worker: String,
    // Worker data
    input: { type: Object, blackbox: true },
    result: { type: Object, blackbox: true },
    error: { type: Object, blackbox: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
