import { test } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsUser;

const PRICE = 'amount isTaxable isNetPrice';

// A discount on a taxed price is itself taxed: its gross amount is what the buyer saves,
// its net amount excludes the tax it takes away. CHF 200.00 cart incl. 8.1% Swiss VAT.
const discountedCart = async (orderNumber, code) => {
  const {
    data: { createCart },
  } = await graphqlFetchAsUser({
    query: /* GraphQL */ `
      mutation createCart($orderNumber: String!) {
        createCart(orderNumber: $orderNumber) {
          _id
        }
      }
    `,
    variables: { orderNumber },
  });
  await graphqlFetchAsUser({
    query: /* GraphQL */ `
      mutation addCartProduct($orderId: ID) {
        addCartProduct(orderId: $orderId, productId: "simpleproduct", quantity: 2) {
          _id
        }
      }
    `,
    variables: { orderId: createCart._id },
  });
  const { errors } = await graphqlFetchAsUser({
    query: /* GraphQL */ `
      mutation addCartDiscount($orderId: ID, $code: String!) {
        addCartDiscount(orderId: $orderId, code: $code) {
          _id
        }
      }
    `,
    variables: { orderId: createCart._id, code },
  });
  assert.equal(errors, undefined);

  const { data } = await graphqlFetchAsUser({
    query: /* GraphQL */ `
      query order($orderId: ID!) {
        order(orderId: $orderId) {
          total { ${PRICE} }
          discountsTotal: total(category: DISCOUNTS) { ${PRICE} }
          items {
            total { ${PRICE} }
            discounts { total { ${PRICE} } }
          }
          discounts {
            gross: total { ${PRICE} }
            net: total(useNetPrice: true) { ${PRICE} }
          }
        }
      }
    `,
    variables: { orderId: createCart._id },
  });
  return data.order;
};

test.describe('Order discount totals', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('a product discount is priced gross and taxable', async () => {
    const order = await discountedCart('discount-totals-half', 'HALFPRICE');
    assert.deepStrictEqual(order.items[0].total, { amount: 10000, isTaxable: true, isNetPrice: false });
    assert.deepStrictEqual(order.items[0].discounts, [
      { total: { amount: -10000, isTaxable: true, isNetPrice: false } },
    ]);
    assert.deepStrictEqual(order.discounts, [
      {
        gross: { amount: -10000, isTaxable: true, isNetPrice: false },
        net: { amount: -9251, isTaxable: true, isNetPrice: true },
      },
    ]);
  });

  test('an order discount is priced gross and taxable', async () => {
    const order = await discountedCart('discount-totals-100off', '100OFF');
    assert.deepStrictEqual(order.total, { amount: 10000, isTaxable: true, isNetPrice: false });
    assert.deepStrictEqual(order.discountsTotal, {
      amount: -10000,
      isTaxable: true,
      isNetPrice: false,
    });
    assert.deepStrictEqual(order.discounts, [
      {
        gross: { amount: -10000, isTaxable: true, isNetPrice: false },
        net: { amount: -9251, isTaxable: true, isNetPrice: true },
      },
    ]);
  });
});
