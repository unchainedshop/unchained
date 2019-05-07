import { Migrations } from 'meteor/percolate:migrations';
import { Filters, FilterTexts } from '../collections';

Migrations.add({
  version: 20190506.4,
  name: 'Add default authorId to filters',
  up() {
    Filters.find()
      .fetch()
      .forEach(({ _id }) => {
        Filters.update(
          { _id },
          {
            $set: {
              authorId: 'root'
            }
          }
        );
      });
    FilterTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        FilterTexts.update(
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
    Filters.find()
      .fetch()
      .forEach(({ _id }) => {
        Filters.update(
          { _id },
          {
            $unset: {
              authorId: 1
            }
          }
        );
      });
    FilterTexts.find()
      .fetch()
      .forEach(({ _id }) => {
        FilterTexts.update(
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
