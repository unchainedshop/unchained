import { Migrations } from 'meteor/percolate:migrations';
import { DeliveryProviders } from '../collections';

Migrations.add({
  version: 20190506.3,
  name: 'Add default authorId to delivery',
  up() {
    DeliveryProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        DeliveryProviders.update(
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
    DeliveryProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        DeliveryProviders.update(
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
