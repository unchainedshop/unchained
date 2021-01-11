import { Migrations } from 'meteor/percolate:migrations';
import { ProductMedia, ProductMediaTexts } from './product-media/collections';
import {
  ProductVariations,
  ProductVariationTexts,
} from './product-variations/collections';
import { ProductTexts } from './products/collections';
import runProductMediaMigrations from './product-media/schema';
import runProductReviewsMigrations from './product-reviews/schema';
import runProductVariationsMigrations from './product-variations/schema';
import runProductsMigrations from './products/schema';

Migrations.add({
  version: 20190506.7,
  name: 'Add default authorId to product medias',
  up() {
    ProductTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductTexts.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          }
        );
      });
    ProductMedia.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductMedia.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
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
              authorId: 'root',
            },
          }
        );
      });
    ProductVariations.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductVariations.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
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
              authorId: 'root',
            },
          }
        );
      });
  },
  down() {
    ProductTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductTexts.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          }
        );
      });
    ProductMedia.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductMedia.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
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
              authorId: 1,
            },
          }
        );
      });
    ProductVariations.find()
      .fetch()
      .forEach(({ _id }) => {
        ProductVariations.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
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
              authorId: 1,
            },
          }
        );
      });
  },
});

export default () => {
  runProductMediaMigrations();
  runProductReviewsMigrations();
  runProductVariationsMigrations();
  runProductsMigrations();
};
