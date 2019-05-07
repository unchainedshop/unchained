import { Migrations } from 'meteor/percolate:migrations';
import * as Collections from '../collections';

Migrations.add({
  version: 20190506.8,
  name: 'Add default authorId',
  up() {
    Collections.Assortments.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.Assortments.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
          }
        );
      });
    Collections.AssortmentTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentTexts.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
          }
        );
      });
    Collections.AssortmentProducts.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentProducts.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
          }
        );
      });
    Collections.AssortmentLinks.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentLinks.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
          }
        );
      });
    Collections.AssortmentFilters.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentFilters.update(
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
    Collections.Assortments.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.Assortments.update(
          { _id },
          {
            $unset: {
              authorId: 1
            }
          }
        );
      });
    Collections.AssortmentTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentTexts.update(
          { _id },
          {
            $unset: {
              authorId: 1
            }
          }
        );
      });
    Collections.AssortmentProducts.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentProducts.update(
          { _id },
          {
            $unset: {
              authorId: 1
            }
          }
        );
      });
    Collections.AssortmentLinks.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentLinks.update(
          { _id },
          {
            $unset: {
              authorId: 1
            }
          }
        );
      });
    Collections.AssortmentFilters.find()
      .fetch()
      .forEach(({ _id }) => {
        Collections.AssortmentFilters.update(
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
