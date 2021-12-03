import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const FilesSchema = new SimpleSchema(
  {
    expires: { type: Date },
    externalFileId: { type: String, required: true },
    meta: { type: Object, blackbox: true },
    name: { type: String, required: true },
    size: { type: String },
    type: { type: String },
    url: { type: String },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
