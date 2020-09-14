import SimpleSchema from 'simpl-schema';
import { Schemas } from 'meteor/unchained:utils';
import { Migrations } from 'meteor/percolate:migrations';

import { ProductMedia, ProductMediaTexts } from './collections';

ProductMedia.attachSchema(
  new SimpleSchema(
    {
      mediaId: { type: String, required: true },
      productId: { type: String, required: true },
      sortKey: { type: Number, required: true },
      tags: Array,
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

ProductMediaTexts.attachSchema(
  new SimpleSchema(
    {
      productMediaId: {
        type: String,
        required: true,
      },
      locale: String,
      authorId: { type: String, required: true },
      title: String,
      subtitle: String,
      ...Schemas.timestampFields,
    },
    { requiredByDefault: false },
  ),
);

Migrations.add({
  version: 20200915.4,
  name: 'drop ProductMedia & ProductMediaTexts related indexes',
  up() {
    ProductMedia.rawCollection().dropIndexes();
    ProductMediaTexts.rawCollection().dropIndexes();
  },
  down() {},
});

export default () => {
  Migrations.migrateTo('latest');
  ProductMedia.rawCollection().createIndex({ mediaId: 1 });
  ProductMedia.rawCollection().createIndex({ productId: 1 });
  ProductMedia.rawCollection().createIndex({ tags: 1 });

  ProductMediaTexts.rawCollection().createIndex({ productMediaId: 1 });
  ProductMediaTexts.rawCollection().createIndex({ locale: 1 });
};
