import { test } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleOrder } from './seeds/orders.js';

let graphqlFetchAsAdmin;

// Order and order item prices carry isNetPrice / isTaxable the same way the simulated
// prices do: isNetPrice follows useNetPrice, isTaxable is whether the (category) total
// contains taxes. The seeded order is CHF 300.00 gross incl. CHF 21.45 item tax.
test.describe('Order and order item totals', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('isNetPrice and isTaxable on order and item totals', async () => {
    const { data: { order } = {}, errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            gross: total {
              amount
              isTaxable
              isNetPrice
            }
            net: total(useNetPrice: true) {
              amount
              isTaxable
              isNetPrice
            }
            delivery: total(category: DELIVERY) {
              amount
              isTaxable
              isNetPrice
            }
            items {
              gross: total {
                amount
                isTaxable
                isNetPrice
              }
              net: total(useNetPrice: true) {
                amount
                isTaxable
                isNetPrice
              }
              unitPrice {
                amount
                isTaxable
                isNetPrice
              }
              netUnitPrice: unitPrice(useNetPrice: true) {
                amount
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
    assert.deepStrictEqual(order.gross, { amount: 30000, isTaxable: true, isNetPrice: false });
    assert.deepStrictEqual(order.net, { amount: 27855, isTaxable: true, isNetPrice: true });
    assert.deepStrictEqual(order.delivery, { amount: 0, isTaxable: false, isNetPrice: false });
    assert.deepStrictEqual(order.items[0], {
      gross: { amount: 30000, isTaxable: true, isNetPrice: false },
      net: { amount: 27855, isTaxable: true, isNetPrice: true },
      unitPrice: { amount: 10000, isTaxable: true, isNetPrice: false },
      netUnitPrice: { amount: 9285, isTaxable: true, isNetPrice: true },
    });
  });
});
