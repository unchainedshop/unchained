import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { OrderPricingSheet } from '@unchainedshop/core';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimpleOrder, SimplePosition, SimplePayment, SimpleDelivery } from './seeds/orders.js';
import { SimpleProduct } from './seeds/products.js';

const price = (amount: number) => ({ amount, currencyCode: 'CHF' });
// Fixture setup can target the pre-net checkout; every public price assertion is
// identical. The default path exercises the actual migration on this branch.
const calculationFormat = process.env.PRICING_CONTRACT_FORMAT ?? 'net';
assert.ok(['gross', 'net'].includes(calculationFormat), 'Unsupported pricing contract fixture format');
const useLegacyCalculations = calculationFormat === 'gross';
const pricesFragment = /* GraphQL */ `
  fragment Prices on Order {
    status
    gross: total {
      amount
      currencyCode
    }
    net: total(useNetPrice: true) {
      amount
      currencyCode
    }
    itemGross: total(category: ITEMS) {
      amount
      currencyCode
    }
    itemNet: total(category: ITEMS, useNetPrice: true) {
      amount
      currencyCode
    }
    deliveryGross: total(category: DELIVERY) {
      amount
      currencyCode
    }
    deliveryNet: total(category: DELIVERY, useNetPrice: true) {
      amount
      currencyCode
    }
    paymentGross: total(category: PAYMENT) {
      amount
      currencyCode
    }
    paymentNet: total(category: PAYMENT, useNetPrice: true) {
      amount
      currencyCode
    }
    discountGross: total(category: DISCOUNTS) {
      amount
      currencyCode
    }
    discountNet: total(category: DISCOUNTS, useNetPrice: true) {
      amount
      currencyCode
    }
    tax: total(category: TAXES) {
      amount
      currencyCode
    }
    discounts {
      code
      total {
        amount
        currencyCode
      }
      discounted {
        __typename
        total {
          amount
          currencyCode
        }
      }
    }
    items {
      quantity
      gross: total {
        amount
        currencyCode
      }
      net: total(useNetPrice: true) {
        amount
        currencyCode
      }
      unitGross: unitPrice {
        amount
        currencyCode
      }
      unitNet: unitPrice(useNetPrice: true) {
        amount
        currencyCode
      }
    }
  }
`;

describe('GraphQL order pricing contracts', () => {
  let db;
  let graphqlFetch;
  let migrate: () => Promise<void>;

  beforeEach(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
    if (useLegacyCalculations) {
      migrate = async () => undefined;
      return;
    }
    const { default: migrateOrderCalculationToNet } =
      await import('../packages/core-orders/src/migrations/20260907120000-order-calculation-net.ts');
    migrateOrderCalculationToNet({
      db,
      register: (migration) => {
        migrate = () => migration.up({});
      },
    } as any);
  });

  const request = async (query: string, variables = {}) => {
    const result = await graphqlFetch({ query, variables });
    assert.equal(result.status, 200, JSON.stringify(result.errors));
    assert.equal(result.errors, undefined, JSON.stringify(result.errors));
    return result.data;
  };
  const readPrices = async (orderId: string) => {
    const { order } = await request(
      `${pricesFragment} query($orderId: ID!) { order(orderId: $orderId) { ...Prices } }`,
      { orderId },
    );
    order.discounts.sort((a, b) => a.code.localeCompare(b.code));
    return order;
  };

  const insertOrder = async (orderId: string, status: string | null, fresh: boolean) => {
    const first = `${orderId}-first`;
    const second = `${orderId}-second`;
    const legacy = [
      { category: 'ITEMS', amount: 10_000 },
      { category: 'TAXES', baseCategory: 'ITEMS', amount: 715 },
      { category: 'DELIVERY', amount: 2_000 },
      { category: 'TAXES', baseCategory: 'DELIVERY', amount: 143 },
      { category: 'PAYMENT', amount: 500 },
      { category: 'TAXES', baseCategory: 'PAYMENT', amount: 36 },
      { category: 'DISCOUNTS', amount: -1_000, discountId: first },
      { category: 'TAXES', baseCategory: 'DISCOUNTS', amount: -71.5, discountId: first },
      { category: 'DISCOUNTS', amount: -250, discountId: second },
      { category: 'TAXES', baseCategory: 'DISCOUNTS', amount: -17.9, discountId: second },
    ];
    const sheet = OrderPricingSheet({ currencyCode: 'CHF' });
    sheet.addItems({ amount: useLegacyCalculations ? 10_000 : 9_285, taxAmount: 715 });
    sheet.addDelivery({ amount: useLegacyCalculations ? 2_000 : 1_857, taxAmount: 143 });
    sheet.addPayment({ amount: useLegacyCalculations ? 500 : 464, taxAmount: 36 });
    sheet.addDiscount({
      amount: useLegacyCalculations ? -1_000 : -928.5,
      taxAmount: -71.5,
      discountId: first,
    });
    sheet.addDiscount({
      amount: useLegacyCalculations ? -250 : -232.1,
      taxAmount: -17.9,
      discountId: second,
    });
    await db.collection('orders').insertOne({
      ...SimpleOrder,
      _id: orderId,
      status,
      deliveryId: `${orderId}-delivery`,
      paymentId: `${orderId}-payment`,
      calculation: fresh ? sheet.calculation : legacy,
    });
    await db.collection('order_deliveries').insertOne({
      ...SimpleDelivery,
      _id: `${orderId}-delivery`,
      orderId,
    });
    await db.collection('order_payments').insertOne({
      ...SimplePayment,
      _id: `${orderId}-payment`,
      orderId,
    });
    await db.collection('order_positions').insertOne({
      ...SimplePosition,
      _id: `${orderId}-position`,
      orderId,
      quantity: 2,
      calculation: [
        { category: 'ITEM', amount: 9_285, isNetPrice: true },
        { category: 'TAX', baseCategory: 'ITEM', amount: 715 },
      ],
    });
    await db.collection('order_discounts').insertMany([
      { _id: first, orderId, code: 'FIRST', trigger: 'USER' },
      { _id: second, orderId, code: 'SECOND', trigger: 'USER' },
    ]);
  };

  for (const status of [null, 'PENDING', 'CONFIRMED', 'FULFILLED', 'REJECTED']) {
    test(`serializes identical gross/net prices for historical and fresh ${status ?? 'OPEN'} orders`, async () => {
      await insertOrder('historical', status, false);
      await insertOrder('fresh', status, true);
      await migrate();
      const historical = await readPrices('historical');
      assert.deepEqual(historical, await readPrices('fresh'));
      assert.deepEqual(historical, {
        status: status ?? 'OPEN',
        gross: price(11_250),
        net: price(10_445),
        itemGross: price(10_000),
        itemNet: price(9_285),
        deliveryGross: price(2_000),
        deliveryNet: price(1_857),
        paymentGross: price(500),
        paymentNet: price(464),
        discountGross: price(-1_250),
        discountNet: price(-1_161),
        tax: price(805),
        discounts: [
          {
            code: 'FIRST',
            total: price(-1_000),
            discounted: [{ __typename: 'OrderGlobalDiscount', total: price(-1_000) }],
          },
          {
            code: 'SECOND',
            total: price(-250),
            discounted: [{ __typename: 'OrderGlobalDiscount', total: price(-250) }],
          },
        ],
        items: [
          {
            quantity: 2,
            gross: price(10_000),
            net: price(9_285),
            unitGross: price(5_000),
            unitNet: price(4_643),
          },
        ],
      });
    });
  }

  test('serializes the preserved historical half-cent total', async () => {
    await db.collection('orders').insertOne({
      ...SimpleOrder,
      _id: 'half-cent',
      status: 'CONFIRMED',
      calculation: [
        { category: 'ITEMS', amount: 135 },
        { category: 'TAXES', baseCategory: 'ITEMS', amount: 9.651810584958213 },
        { category: 'DISCOUNTS', amount: -13.5, discountId: 'promo' },
        {
          category: 'TAXES',
          baseCategory: 'DISCOUNTS',
          amount: -0.9651810584958209,
          discountId: 'promo',
        },
      ],
    });
    await migrate();
    const { order } = await request(/* GraphQL */ `
      query {
        order(orderId: "half-cent") {
          gross: total {
            amount
            currencyCode
          }
          net: total(useNetPrice: true) {
            amount
            currencyCode
          }
        }
      }
    `);
    assert.deepEqual(order, { gross: price(121), net: price(113) });
  });

  test('keeps empty calculations nullable in GraphQL', async () => {
    await db.collection('orders').insertOne({ ...SimpleOrder, _id: 'empty', calculation: [] });
    const { order } = await request(/* GraphQL */ `
      query {
        order(orderId: "empty") {
          gross: total {
            amount
          }
          net: total(useNetPrice: true) {
            amount
          }
          items: total(category: ITEMS) {
            amount
          }
        }
      }
    `);
    assert.deepEqual(order, { gross: null, net: null, items: null });
  });

  test('recalculates, discounts and checks out a taxable cart through the registered plugins', async () => {
    const { createCart } = await request(
      'mutation { createCart(orderNumber: "pricing-contract") { _id } }',
    );
    const orderId = createCart._id;
    await request(
      /* GraphQL */ `
        mutation ($orderId: ID!, $productId: ID!) {
          addCartProduct(orderId: $orderId, productId: $productId, quantity: 2) {
            _id
          }
        }
      `,
      { orderId, productId: SimpleProduct._id },
    );
    const before = await readPrices(orderId);
    assert.deepEqual(before.gross, price(20_000));
    assert.deepEqual(before.itemGross, price(20_000));
    // The seeded gross catalog price uses the bundled Swiss default rate (8.1%).
    assert.deepEqual(before.net, price(18_501));
    assert.deepEqual(before.tax, price(1_499));
    assert.deepEqual(before.net, before.items[0].net);
    assert.deepEqual(before.itemNet, before.items[0].net);
    assert.deepEqual(before.items[0].unitGross, price(10_000));
    assert.deepEqual(before.items[0].unitNet, price(9_251));

    const { addCartDiscount } = await request(
      /* GraphQL */ `
        mutation ($orderId: ID!) {
          addCartDiscount(orderId: $orderId, code: "100OFF") {
            _id
            total {
              amount
              currencyCode
            }
          }
        }
      `,
      { orderId },
    );
    assert.deepEqual(addCartDiscount.total, price(-10_000));
    const discounted = await readPrices(orderId);
    assert.deepEqual(discounted.gross, price(10_000));
    assert.deepEqual(discounted.net, price(9_251));
    assert.deepEqual(discounted.tax, price(749));
    assert.deepEqual(discounted.discountGross, price(-10_000));
    assert.deepEqual(discounted.discountNet, price(-9_251));
    assert.deepEqual(discounted.itemGross, before.itemGross);
    assert.deepEqual(discounted.itemNet, before.itemNet);

    await request(
      /* GraphQL */ `
        mutation ($orderId: ID!) {
          updateCart(
            orderId: $orderId
            contact: { emailAddress: "pricing@example.test" }
            billingAddress: {
              firstName: "Price"
              lastName: "Test"
              addressLine: "Teststrasse 1"
              postalCode: "8000"
              city: "Zürich"
              countryCode: "CH"
            }
          ) {
            _id
          }
        }
      `,
      { orderId },
    );
    const { checkoutCart } = await request(
      `${pricesFragment} mutation($orderId: ID!) { checkoutCart(orderId: $orderId) { ...Prices } }`,
      { orderId },
    );
    assert.deepEqual(checkoutCart, { ...discounted, status: 'CONFIRMED' });
    assert.deepEqual(await readPrices(orderId), checkoutCart);
  });
});
