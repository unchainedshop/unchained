import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const BookmarkSchema = new SimpleSchema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    meta: { type: Object, blackbox: true, required: false },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
