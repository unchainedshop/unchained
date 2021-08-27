import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';

import { MediaObjects } from './collections';

MediaObjects.attachSchema(
  new SimpleSchema(
    {
      url: { type: String },
      name: { type: String, required: true },
      size: { type: String },
      type: { type: String },
      expires: { type: Date, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  MediaObjects.rawCollection().createIndex({
    created: -1,
  });
};
