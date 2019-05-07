import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { ProductVariations, ProductVariationTexts } from './collections';

export const ProductVariationType = { // eslint-disable-line
  COLOR: 'COLOR',
  TEXT: 'TEXT'
};

ProductVariations.attachSchema(
  new SimpleSchema(
    {
      productId: { type: String, required: true, index: true },
      key: String,
      type: String,
      options: Array,
      'options.$': String,
      authorId: { type: String, required: true },
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);

ProductVariationTexts.attachSchema(
  new SimpleSchema(
    {
      productVariationId: {
        type: String,
        required: true,
        index: true
      },
      productVariationOptionValue: String,
      locale: { type: String, index: true },
      title: String,
      subtitle: String,
      authorId: { type: String, required: true },
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);
