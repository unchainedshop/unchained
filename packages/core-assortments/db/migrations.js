import { Migrations } from 'meteor/percolate:migrations';
import {
  AssortmentMedia,
  AssortmentMediaTexts,
} from './assortment-media/collections';

import runAssortmentMediaMigrations from './assortment-media/schema';
import runAssortmentsMigrations from './assortments/schema';

Migrations.add({
  version: 20210524.1,
  name: 'Add default authorId to assortment medias',
  up() {
    AssortmentMedia.find()
      .fetch()
      .forEach(({ _id }) => {
        AssortmentMedia.update(
          { _id },
          {
            $set: {
              authorId: 'root',
            },
          }
        );
      });
    AssortmentMediaTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        AssortmentMediaTexts.update(
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
    AssortmentMedia.find()
      .fetch()
      .forEach(({ _id }) => {
        AssortmentMedia.update(
          { _id },
          {
            $unset: {
              authorId: 1,
            },
          }
        );
      });
    AssortmentMediaTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        AssortmentMediaTexts.update(
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
  runAssortmentMediaMigrations();
  runAssortmentsMigrations();
};
