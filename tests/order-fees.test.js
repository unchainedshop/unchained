import { test } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleOrder, SimpleDelivery, SimplePayment } from './seeds/orders.js';

let graphqlFetchAsAdmin;

// OrderDelivery.fee / OrderPayment.fee are the gross amounts the order charges for
// the delivery / payment: the total of their pricing sheets, the same value the
// order-level DELIVERY / PAYMENT rows carry.
test.describe('Order delivery and payment fees', () => {
  test.before(async () => {
    const [db] = await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);

    // CHF 12.00 gross delivery fee incl. 8.1% VAT, CHF 1.50 gross payment fee incl. 8.1% VAT
    const deliveryTax = 1200 - 1200 / 1.081;
    const paymentTax = 150 - 150 / 1.081;
    await db.collection('order_deliveries').updateOne(
      { _id: SimpleDelivery._id },
      {
        $set: {
          calculation: [
            { category: 'DELIVERY', amount: 1200, isTaxable: true, isNetPrice: false },
            { category: 'DELIVERY', amount: -deliveryTax, isTaxable: false, isNetPrice: true },
            { category: 'TAX', amount: deliveryTax, rate: 0.081, isTaxable: false, isNetPrice: false },
          ],
        },
      },
    );
    await db.collection('order_payments').updateOne(
      { _id: SimplePayment._id },
      {
        $set: {
          calculation: [
            { category: 'PAYMENT', amount: 150, isTaxable: true, isNetPrice: false },
            { category: 'PAYMENT', amount: -paymentTax, isTaxable: false, isNetPrice: true },
            { category: 'TAX', amount: paymentTax, rate: 0.081, isTaxable: false, isNetPrice: false },
          ],
        },
      },
    );
  });

  test.after(async () => {
    await disconnect();
  });

  test('fee is the gross total of the delivery and payment pricing', async () => {
    const { data: { order } = {}, errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            delivery {
              fee {
                amount
                currencyCode
                isTaxable
                isNetPrice
              }
            }
            payment {
              fee {
                amount
                currencyCode
                isTaxable
                isNetPrice
              }
            }
          }
        }
      `,
      variables: { orderId: SimpleOrder._id },
    });
    assert.equal(errors, undefined);
    assert.deepStrictEqual(order.delivery.fee, {
      amount: 1200,
      currencyCode: 'CHF',
      isTaxable: true,
      isNetPrice: false,
    });
    assert.deepStrictEqual(order.payment.fee, {
      amount: 150,
      currencyCode: 'CHF',
      isTaxable: true,
      isNetPrice: false,
    });
  });
});
