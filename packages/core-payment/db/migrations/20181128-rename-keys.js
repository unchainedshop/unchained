import { Migrations } from 'meteor/percolate:migrations';
import { PaymentProviders } from '../collections';

Migrations.add({
  version: 20181128,
  name: 'Rename payment provider keys',
  up() {
    PaymentProviders.update(
      { adapterKey: 'ch.dagobert.invoice' },
      {
        $set: { adapterKey: 'shop.unchained.invoice' }
      },
      { multi: true }
    );
  },
  down() {
    PaymentProviders.update(
      { adapterKey: 'shop.unchained.invoice' },
      {
        $set: { adapterKey: 'ch.dagobert.invoice' }
      },
      { multi: true }
    );
  }
});
