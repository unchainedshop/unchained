import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';
import { Bookmarks } from './collections';

Bookmarks.attachSchema(
  new SimpleSchema(
    {
      userId: { type: String, required: true, index: true },
      productId: { type: String, required: true, index: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);
