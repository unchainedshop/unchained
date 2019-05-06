import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';
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

Migrations.add({
  version: 20190506.6,
  name: 'Add default authorId',
  up() {
    ProductVariations.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductVariations.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
          }
        );
      });
    ProductVariationTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductVariationTexts.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
          }
        );
      });
  },
  down() {
    ProductVariations.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductVariations.update(
          { _id },
          {
            $unset: {
              authorId: 1
            }
          }
        );
      });
    ProductVariationTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductVariationTexts.update(
          { _id },
          {
            $unset: {
              authorId: 1
            }
          }
        );
      });
  }
});
