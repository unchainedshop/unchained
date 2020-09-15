import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';

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

Migrations.add({
  version: 20200915.6,
  name: 'drop ProductVariations & ProductVariationTexts related indexes',
  up() {
    ProductVariations.rawCollection().dropIndexes();
    ProductVariationTexts.rawCollection().dropIndexes();
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  ProductVariations.rawCollection().createIndex({ productId: 1 });

  ProductVariationTexts.rawCollection().createIndex({ productVariationId: 1 });
  ProductVariationTexts.rawCollection().createIndex({ locale: 1 });
};
