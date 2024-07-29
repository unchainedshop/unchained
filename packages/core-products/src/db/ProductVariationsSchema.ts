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
    tags: Array,
    'tags.$': String,
    options: Array,
    'options.$': String,
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
    locale: Intl.Locale,
    title: String,
    subtitle: String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
