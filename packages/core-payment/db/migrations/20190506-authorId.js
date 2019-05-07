import { Migrations } from 'meteor/percolate:migrations';
import { PaymentProviders } from '../collections';

Migrations.add({
  version: 20190506.2,
  name: 'Add default authorId to payment',
  up() {
    PaymentProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        PaymentProviders.update(
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
    PaymentProviders.find()
      .fetch()
      .forEach(({ _id }) => {
        PaymentProviders.update(
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
