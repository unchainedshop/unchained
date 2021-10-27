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
      expires: { type: Date },
      meta: { type: Object, blackbox: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  MediaObjects.createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  MediaObjects.rawCollection().createIndex({
    created: -1,
  });
};
