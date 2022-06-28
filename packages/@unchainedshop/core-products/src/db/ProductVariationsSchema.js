import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const ProductVariationType = {
  COLOR: 'COLOR',
  TEXT: 'TEXT',
};

export const ProductVariationsSchema = new SimpleSchema(
  {
    productId: { type: String, required: true },
    key: String,
    type: String,
    options: Array,
    'options.$': String,
    authorId: { type: String, required: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);

export const ProductVariationTextsSchema = new SimpleSchema(
  {
    productVariationId: {
      type: String,
      required: true,
    },
    productVariationOptionValue: String,
    locale: String,
    title: String,
    subtitle: String,
    authorId: { type: String, required: true },
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
