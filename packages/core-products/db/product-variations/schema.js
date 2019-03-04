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
      productId: { type: SimpleSchema.RegEx.Id, required: true, index: true },
      key: String,
      type: String,
      options: Array,
      'options.$': String,
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);

ProductVariationTexts.attachSchema(
  new SimpleSchema(
    {
      productVariationId: {
        type: SimpleSchema.RegEx.Id,
        required: true,
        index: true
      },
      productVariationOptionValue: String,
      locale: { type: String, index: true },
      title: String,
      subtitle: String,
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);
