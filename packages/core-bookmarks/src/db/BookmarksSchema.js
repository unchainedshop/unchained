import { SchemaFields } from 'unchained-core-mongodb-utils';
import SimpleSchema from 'simpl-schema';

export const BookmarkSchema = new SimpleSchema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    ...SchemaFields.timestampFields,
  },
  { requiredByDefault: false }
);
