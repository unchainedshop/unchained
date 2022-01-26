import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureOrdersModule } from 'meteor/unchained:core-orders';
import { OrdersModule } from '@unchainedshop/types/orders';

describe('Test exports', () => {
  let module: OrdersModule;

  before(async () => {
    const db = initDb();
    module = await configureOrdersModule({ db }).catch((error) => {
      console.error(error);

      throw error;
    });
  });

  it('Insert order', async () => {
    let order = await module.create(
      {
        billingAddress: {
          lastName: 'Mustermann',
          firstName: 'Max',
          addressLine: 'Teststreet 11',
          city: 'Zürich',
          postalCode: '8009',
          company: 'Unchained Commerce',
          countryCode: 'CH',
        },
        orderNumber: 'Nr-1234123',
        currency: 'CHF',
        countryCode: 'CH',
      },
      'Test-User-1'
    );

    assert.ok(order);
    const orderId = order._id;
    order = await module.findOrder({ orderId });

    assert.ok(order);

    const deletedCount = await module
      .delete(orderId, 'Test-User-1')
      .catch((error) => {
        console.log(error);
        return 0;
      });
    assert.equal(deletedCount, 1);
  });
});
