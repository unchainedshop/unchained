import SimpleSchema from 'simpl-schema';
import { Migrations } from 'meteor/percolate:migrations';
import { Schemas } from 'meteor/unchained:utils';
import { ProductMedia, ProductMediaTexts } from './collections';

ProductMedia.attachSchema(
  new SimpleSchema(
    {
      mediaId: { type: String, required: true, index: true },
      productId: { type: String, required: true, index: true },
      sortKey: { type: Number, required: true },
      tags: { type: Array, index: true },
      'tags.$': String,
      meta: { type: Object, blackbox: true },
      authorId: { type: String, required: true },
      ...Schemas.timestampFields
    },
    { requiredByDefault: false }
  )
);

ProductMediaTexts.attachSchema(
  new SimpleSchema(
    {
      productMediaId: {
        type: String,
        required: true,
        index: true
      },
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
  version: 20190506.7,
  name: 'Add default authorId to product medias',
  up() {
    ProductMedia.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductMedia.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
          }
        );
      });
    ProductMediaTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductMediaTexts.update(
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
    ProductMedia.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductMedia.update(
          { _id },
          {
            $unset: {
              authorId: 1
            }
          }
        );
      });
    ProductMediaTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductMediaTexts.update(
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
