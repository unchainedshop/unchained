import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { Bookmarks } from './collections';

Bookmarks.attachSchema(
  new SimpleSchema(
    {
      userId: { type: String, required: true },
      productId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false }
  )
);

export default () => {
  Bookmarks.rawCollection().createIndex({ userId: 1 });
  Bookmarks.rawCollection().createIndex({ productId: 1 });
};
