import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { ProductVariations, ProductVariationTexts } from './collections';

// eslint-disable-next-line
export const ProductVariationType = {
  COLOR: 'COLOR',
  TEXT: 'TEXT',
};

ProductVariations.attachSchema(
  new SimpleSchema(
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
  ),
);

ProductVariations.rawCollection().createIndex({ productId: 1 });

ProductVariationTexts.attachSchema(
  new SimpleSchema(
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
  ),
);

ProductVariationTexts.rawCollection().createIndex({ productVariationId: 1 });
ProductVariationTexts.rawCollection().createIndex({ locale: 1 });
