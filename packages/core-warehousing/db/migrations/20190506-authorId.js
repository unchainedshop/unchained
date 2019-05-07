import { Migrations } from 'meteor/percolate:migrations';
import { WarehousingProviders } from '../collections';

Migrations.add({
  version: 20190506.1,
  name: 'Add default authorId to warehousing provider',
  up() {
    WarehousingProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        WarehousingProviders.update(
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
    WarehousingProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        WarehousingProviders.update(
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
