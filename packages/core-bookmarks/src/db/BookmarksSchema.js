import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

export const BookmarkSchema = new SimpleSchema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false }
);
