import { Migrations } from 'meteor/percolate:migrations';
import { DeliveryProviders } from '../collections';

Migrations.add({
  version: 20181128,
  name: 'Rename delivery provider keys',
  up() {
    DeliveryProviders.update(
      { adapterKey: 'ch.dagobert.post' },
      {
        $set: { adapterKey: 'shop.unchained.post' }
      },
      { multi: true }
    );
  },
  down() {
    DeliveryProviders.update(
      { adapterKey: 'shop.unchained.post' },
      {
        $set: { adapterKey: 'ch.dagobert.post' }
      },
      { multi: true }
    );
  }
});
