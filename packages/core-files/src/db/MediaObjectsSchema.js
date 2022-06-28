import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const MediaObjectsSchema = new SimpleSchema(
  {
    expires: { type: Date },
    path: { type: String, required: true },
    meta: { type: Object, blackbox: true },
    name: { type: String, required: true },
    size: { type: String },
    type: { type: String },
    url: { type: String },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
