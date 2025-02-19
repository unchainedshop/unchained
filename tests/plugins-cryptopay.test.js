import test from 'node:test';
import assert from 'node:assert';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders.js';
import { SimpleProduct } from './seeds/products.js';
import { BTC_DERIVATIONS, ETH_DERIVATIONS, BTCCurrency, SHIBCurrency } from './seeds/cryptopay.js';

let db;
let graphqlFetch;

test.before(async () => {
  [db] = await setupDatabase();
  graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

  await db.collection('products').findOrInsertOne({
    ...SimpleProduct,
    _id: 'single-item-product-id',
  });

  await db.collection('currencies').findOrInsertOne(BTCCurrency);

  await db.collection('currencies').findOrInsertOne(SHIBCurrency);

  await db.collection('product_rates').findOrInsertOne({
    baseCurrency: 'CHF',
    quoteCurrency: SHIBCurrency.contractAddress,
    rate: 0.00002711,
    timestamp: Math.round(Date.now() / 1000),
  });

  const SimpleBtcProduct = {
    ...SimpleProduct,
    commerce: {
      pricing: [
        {
          amount: 10 ** 7, // 0.1 BTC
          maxQuantity: 0,
          isTaxable: false,
          isNetPrice: false,
          currencyCode: 'BTC',
          countryCode: 'CH',
        },
      ],
    },
  };

  await db.collection('products').findOrInsertOne({
    ...SimpleBtcProduct,
    _id: 'single-btc-item-product-id',
  });

  await db.collection('payment-providers').findOrInsertOne({
    ...SimplePaymentProvider,
    _id: 'cryptopay-payment-provider',
    adapterKey: 'shop.unchained.payment.cryptopay',
    type: 'GENERIC',
  });

  // Add a demo order ready to checkout
  await db.collection('order_payments').findOrInsertOne({
    ...SimplePayment,
    _id: 'cryptopay-payment',
    paymentProviderId: 'cryptopay-payment-provider',
    orderId: 'cryptopay-order',
  });

  await db.collection('order_positions').findOrInsertOne({
    ...SimplePosition,
    _id: 'cryptopay-order-position',
    orderId: 'cryptopay-order',
    quantity: 1,
    productId: 'single-btc-item-product-id',
    calculation: [
      {
        category: 'ITEM',
        amount: 10 ** 7, // 0.1 BTC
        isTaxable: false,
        isNetPrice: false,
        meta: {
          adapter: 'shop.unchained.pricing.product-price',
        },
      },
    ],
  });

  await db.collection('orders').findOrInsertOne({
    ...SimpleOrder,
    _id: 'cryptopay-order',
    orderNumber: 'cryptopay',
    paymentId: 'cryptopay-payment',
    currency: 'BTC',
    calculation: [
      {
        category: 'ITEMS',
        amount: 10 ** 7,
      },
      {
        category: 'PAYMENT',
        amount: 0,
      },
      {
        category: 'DELIVERY',
        amount: 0,
      },
      {
        category: 'DISCOUNTS',
        amount: 0,
      },
    ],
  });

  // Add a second demo order ready to checkout
  await db.collection('order_payments').findOrInsertOne({
    ...SimplePayment,
    _id: 'cryptopay-payment2',
    paymentProviderId: 'cryptopay-payment-provider',
    orderId: 'cryptopay-order2',
  });

  await db.collection('order_positions').findOrInsertOne({
    ...SimplePosition,
    _id: 'cryptopay-order-position2',
    orderId: 'cryptopay-order2',
    quantity: 1,
    productId: 'single-item-product-id',
  });

  await db.collection('orders').findOrInsertOne({
    ...SimpleOrder,
    _id: 'cryptopay-order2',
    orderNumber: 'cryptopay2',
    paymentId: 'cryptopay-payment2',
  });
});

test.skip('Plugins: Cryptopay Payments', async (t) => {
  await t.test('Derive address for first order', async () => {
    const { data } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation signPaymentProviderForCheckout($orderPaymentId: ID!) {
          signPaymentProviderForCheckout(orderPaymentId: $orderPaymentId)
        }
      `,
      variables: {
        orderPaymentId: 'cryptopay-payment',
      },
    });
    assert.deepStrictEqual(JSON.parse(data?.signPaymentProviderForCheckout), [
      { currency: 'BTC', address: BTC_DERIVATIONS[0] },
      { currency: 'ETH', address: ETH_DERIVATIONS[0] },
    ]);
  });

  await t.test('Derive address for second order', async () => {
    const { data } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation signPaymentProviderForCheckout($orderPaymentId: ID!) {
          signPaymentProviderForCheckout(orderPaymentId: $orderPaymentId)
        }
      `,
      variables: {
        orderPaymentId: 'cryptopay-payment2',
      },
    });
    assert.deepStrictEqual(JSON.parse(data?.signPaymentProviderForCheckout), [
      { currency: 'BTC', address: BTC_DERIVATIONS[1] },
      { currency: 'ETH', address: ETH_DERIVATIONS[1] },
    ]);
  });

  await t.test('Immutable derivations: Address for order payments should not change', async () => {
    const { data } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation signPaymentProviderForCheckout($orderPaymentId: ID!) {
          signPaymentProviderForCheckout(orderPaymentId: $orderPaymentId)
        }
      `,
      variables: {
        orderPaymentId: 'cryptopay-payment',
      },
    });
    assert.deepStrictEqual(JSON.parse(data?.signPaymentProviderForCheckout), [
      { currency: 'BTC', address: BTC_DERIVATIONS[0] },
      { currency: 'ETH', address: ETH_DERIVATIONS[0] },
    ]);
  });

  await t.test('Payments Webhook (Cryptopay)', async (t) => {
    // Setup addresses for tests
    await db.collection('order_payments').updateOne(
      { _id: 'cryptopay-payment' },
      {
        $set: {
          context: [
            { currency: 'BTC', address: BTC_DERIVATIONS[0] },
            { currency: 'ETH', address: ETH_DERIVATIONS[0] },
          ],
        },
      },
    );
    await db.collection('order_payments').updateOne(
      { _id: 'cryptopay-payment2' },
      {
        $set: {
          context: [
            { currency: 'BTC', address: BTC_DERIVATIONS[1] },
            { currency: 'ETH', address: ETH_DERIVATIONS[1] },
          ],
        },
      },
    );

    await t.test('Invalid secret', async () => {
      const result = await fetch('http://localhost:4010/payment/cryptopay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        duplex: 'half',
        body: JSON.stringify({
          currency: 'BTC',
          contract: null,
          decimals: 8,
          address: BTC_DERIVATIONS[0],
          amount: 10 ** 8,
          secret: 'invalid',
        }),
      });
      assert.deepStrictEqual(await result.json(), { success: false });
      const orderPayment = await db.collection('order_payments').findOne({ _id: 'cryptopay-payment' });
      assert.notStrictEqual(orderPayment.status, 'PAID');
    });

    await t.test('Pay too little for product with crypto prices', async () => {
      const result = await fetch('http://localhost:4010/payment/cryptopay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        duplex: 'half',
        body: JSON.stringify({
          currency: 'BTC',
          contract: null,
          decimals: 8,
          address: BTC_DERIVATIONS[0],
          amount: 5 ** 7,
          secret: 'secret',
        }),
      });
      assert.deepStrictEqual(await result.json(), { success: false });
      const orderPayment = await db.collection('order_payments').findOne({ _id: 'cryptopay-payment' });
      assert.notStrictEqual(orderPayment.status, 'PAID');
    });

    await t.test('Pay product with crypto prices', async () => {
      const result = await fetch('http://localhost:4010/payment/cryptopay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        duplex: 'half',
        body: JSON.stringify({
          currency: 'BTC',
          contract: null,
          decimals: 8,
          address: BTC_DERIVATIONS[0],
          amount: 10 ** 7,
          secret: 'secret',
        }),
      });
      assert.deepStrictEqual(await result.json(), { success: true });
      const orderPayment = await db.collection('order_payments').findOne({ _id: 'cryptopay-payment' });
      assert.strictEqual(orderPayment.status, 'PAID');
    });

    await t.test('Pay too little for converted prices', async () => {
      const result = await fetch('http://localhost:4010/payment/cryptopay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        duplex: 'half',
        body: JSON.stringify({
          currency: 'ETH',
          contract: SHIBCurrency.contractAddress,
          decimals: 18,
          address: ETH_DERIVATIONS[1],
          amount: '1844337882700110748172344', // 50 Fr. at an SHIB / CHF exchange rate of ~ 0.00002711
          secret: 'secret',
        }),
      });
      assert.deepStrictEqual(await result.json(), { success: false });
      const orderPayment = await db.collection('order_payments').findOne({ _id: 'cryptopay-payment2' });
      assert.notStrictEqual(orderPayment.status, 'PAID');
    });

    await t.test('Pay product with fiat prices in SHIB', async () => {
      const result = await fetch('http://localhost:4010/payment/cryptopay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        duplex: 'half',
        body: JSON.stringify({
          currency: 'ETH',
          contract: SHIBCurrency.contractAddress,
          decimals: 18,
          address: ETH_DERIVATIONS[1],
          amount: '11857248247879012000000000', // 107.15 Fr. at an SHIB / CHF exchange rate of ~ 0.00002711
          secret: 'secret',
        }),
      });
      assert.deepStrictEqual(await result.json(), { success: true });
      const orderPayment = await db.collection('order_payments').findOne({ _id: 'cryptopay-payment2' });
      assert.strictEqual(orderPayment.status, 'PAID');
    });
  });
});
