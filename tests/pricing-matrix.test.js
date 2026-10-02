import { test } from 'node:test';
import assert from 'node:assert';
import { DeliveryPricingAdapter, PaymentPricingAdapter, pluginRegistry } from '@unchainedshop/core';
import { ProductEuTaxPlugin } from '@unchainedshop/plugins/pricing/product-eu-tax';
import { DeliveryEuTaxPlugin } from '@unchainedshop/plugins/pricing/delivery-eu-tax';
import { PaymentEuTaxPlugin } from '@unchainedshop/plugins/pricing/payment-eu-tax';
import { ProductUkTaxPlugin } from '@unchainedshop/plugins/pricing/product-uk-tax';
import { DeliveryUkTaxPlugin } from '@unchainedshop/plugins/pricing/delivery-uk-tax';
import { PaymentUkTaxPlugin } from '@unchainedshop/plugins/pricing/payment-uk-tax';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';

// Prices whole carts the way a shop does: 2 x simpleproduct (100.00 incl. VAT), a 10.00
// net delivery fee and a 1.50 gross payment fee, with the Swiss (registered by the test
// platform), EU and UK tax plugins. Every price is checked for its amount and for
// isNetPrice / isTaxable, and the categories must add up to the order total.

// Plugins cannot be unregistered and the test files share one process: the adapters
// registered here only activate while this file runs.
let active = false;
const whileActive = (adapter) => ({
  ...adapter,
  isActivatedFor: (context) => active && adapter.isActivatedFor(context),
});

const fee = (Adapter, key, amount, isNetPrice) =>
  whileActive({
    ...Adapter,
    key,
    label: key,
    version: '1.0.0',
    orderIndex: 0,
    isActivatedFor: () => true,
    actions: (params) => {
      const pricingAdapter = Adapter.actions(params);
      return {
        ...pricingAdapter,
        calculate: async () => {
          pricingAdapter.resultSheet().addFee({ amount, isTaxable: true, isNetPrice });
          return pricingAdapter.calculate();
        },
      };
    },
  });

const PRICE = 'amount isTaxable isNetPrice';
const ORDER_QUERY = /* GraphQL */ `
  query order($orderId: ID!) {
    order(orderId: $orderId) {
      currency { isoCode }
      total { ${PRICE} }
      totalNet: total(useNetPrice: true) { ${PRICE} }
      itemsTotal: total(category: ITEMS) { ${PRICE} }
      itemsNet: total(category: ITEMS, useNetPrice: true) { ${PRICE} }
      deliveryTotal: total(category: DELIVERY) { ${PRICE} }
      deliveryNet: total(category: DELIVERY, useNetPrice: true) { ${PRICE} }
      paymentTotal: total(category: PAYMENT) { ${PRICE} }
      paymentNet: total(category: PAYMENT, useNetPrice: true) { ${PRICE} }
      discountsTotal: total(category: DISCOUNTS) { ${PRICE} }
      discountsNet: total(category: DISCOUNTS, useNetPrice: true) { ${PRICE} }
      taxes: total(category: TAXES) { ${PRICE} }
      items {
        quantity
        total { ${PRICE} }
        totalNet: total(useNetPrice: true) { ${PRICE} }
        unitPrice { ${PRICE} }
        unitPriceNet: unitPrice(useNetPrice: true) { ${PRICE} }
        discounts { total { ${PRICE} } }
      }
      delivery {
        fee { ${PRICE} }
        provider {
          simulatedPrice(orderId: $orderId) { ${PRICE} }
          simulatedPriceNet: simulatedPrice(orderId: $orderId, useNetPrice: true) { ${PRICE} }
        }
      }
      payment {
        fee { ${PRICE} }
        provider {
          simulatedPrice(orderId: $orderId) { ${PRICE} }
          simulatedPriceNet: simulatedPrice(orderId: $orderId, useNetPrice: true) { ${PRICE} }
        }
      }
      discounts {
        total { ${PRICE} }
        totalNet: total(useNetPrice: true) { ${PRICE} }
      }
    }
  }
`;

// [gross, net] of the order total and its categories, and the tax total
const scenarios = [
  {
    name: 'Switzerland',
    country: 'CH',
    billing: 'CH',
    expected: {
      total: [21231, 19640],
      items: [20000, 18501],
      delivery: [1081, 1000],
      payment: [150, 139],
      discounts: [0, 0],
      taxes: 1591,
    },
  },
  {
    name: 'Switzerland, product discount',
    country: 'CH',
    billing: 'CH',
    code: 'HALFPRICE',
    expected: {
      total: [11231, 10389],
      items: [10000, 9251],
      delivery: [1081, 1000],
      payment: [150, 139],
      discounts: [0, 0],
      taxes: 842,
      itemDiscount: -10000,
      orderDiscount: [-10000, -9251],
    },
  },
  {
    name: 'Switzerland, order discount',
    country: 'CH',
    billing: 'CH',
    code: '100OFF',
    expected: {
      total: [11231, 10389],
      items: [20000, 18501],
      delivery: [1081, 1000],
      payment: [150, 139],
      discounts: [-10000, -9251],
      taxes: 842,
      orderDiscount: [-10000, -9251],
    },
  },
  {
    name: 'Swiss shop, export to the US',
    country: 'CH',
    billing: 'US',
    expected: {
      total: [21150, 21150],
      items: [20000, 20000],
      delivery: [1000, 1000],
      payment: [150, 150],
      discounts: [0, 0],
      taxes: 0,
    },
  },
  {
    name: 'Germany (EU VAT)',
    country: 'DE',
    billing: 'DE',
    expected: {
      total: [21340, 17933],
      items: [20000, 16807],
      delivery: [1190, 1000],
      payment: [150, 126],
      discounts: [0, 0],
      taxes: 3407,
    },
  },
  {
    name: 'German shop, delivery to France (VAT of the destination)',
    country: 'DE',
    billing: 'DE',
    deliveryAddress: 'FR',
    expected: {
      total: [21350, 17792],
      items: [20000, 16667],
      delivery: [1200, 1000],
      payment: [150, 125],
      discounts: [0, 0],
      taxes: 3558,
    },
  },
  {
    name: 'United Kingdom (UK VAT)',
    country: 'GB',
    billing: 'GB',
    expected: {
      total: [21350, 17792],
      items: [20000, 16667],
      delivery: [1200, 1000],
      payment: [150, 125],
      discounts: [0, 0],
      taxes: 3558,
    },
  },
  {
    name: 'Switzerland, empty cart',
    country: 'CH',
    billing: 'CH',
    quantity: 0,
    expected: {
      total: [1231, 1139],
      items: [0, 0],
      delivery: [1081, 1000],
      payment: [150, 139],
      discounts: [0, 0],
      taxes: 92,
    },
  },
];

const price = (amount, isTaxable, isNetPrice) => ({ amount, isTaxable, isNetPrice });

// gross and net of a price that carries tax differ; a discount carries negative tax
const assertPricePair = (label, gross, net, [expectedGross, expectedNet]) => {
  const isTaxable = expectedGross !== expectedNet;
  assert.deepStrictEqual(gross, price(expectedGross, isTaxable, false), `${label} gross`);
  assert.deepStrictEqual(net, price(expectedNet, isTaxable, true), `${label} net`);
};

let db;
let graphqlFetch;

const createCart = async ({ country, billing, deliveryAddress, quantity = 2, code }, index) => {
  const call = async (query, variables) => {
    const { data, errors } = await graphqlFetch({
      query,
      variables,
      headers: { 'x-shop-country': country },
    });
    assert.equal(errors, undefined, JSON.stringify(errors));
    return data;
  };
  const address = (countryCode) => ({
    firstName: 'Ada',
    lastName: 'Lovelace',
    addressLine: 'Street 1',
    postalCode: '1000',
    city: 'City',
    countryCode,
  });

  const { createCart: cart } = await call(
    /* GraphQL */ `
      mutation createCart($orderNumber: String!) {
        createCart(orderNumber: $orderNumber) {
          _id
        }
      }
    `,
    { orderNumber: `pricing-matrix-${index}` },
  );
  await call(
    /* GraphQL */ `
      mutation updateCart($orderId: ID, $billingAddress: AddressInput) {
        updateCart(
          orderId: $orderId
          billingAddress: $billingAddress
          deliveryProviderId: "simple-delivery-provider"
          paymentProviderId: "simple-payment-provider"
        ) {
          _id
        }
      }
    `,
    { orderId: cart._id, billingAddress: address(billing) },
  );
  if (deliveryAddress)
    await call(
      /* GraphQL */ `
        mutation updateCartDeliveryShipping($orderId: ID, $address: AddressInput) {
          updateCartDeliveryShipping(
            orderId: $orderId
            deliveryProviderId: "simple-delivery-provider"
            address: $address
          ) {
            _id
          }
        }
      `,
      { orderId: cart._id, address: address(deliveryAddress) },
    );
  if (quantity)
    await call(
      /* GraphQL */ `
        mutation addCartProduct($orderId: ID, $quantity: Int) {
          addCartProduct(orderId: $orderId, productId: "simpleproduct", quantity: $quantity) {
            _id
          }
        }
      `,
      { orderId: cart._id, quantity },
    );
  if (code)
    await call(
      /* GraphQL */ `
        mutation addCartDiscount($orderId: ID, $code: String!) {
          addCartDiscount(orderId: $orderId, code: $code) {
            _id
          }
        }
      `,
      { orderId: cart._id, code },
    );

  const { order } = await call(ORDER_QUERY, { orderId: cart._id });
  return order;
};

test.describe('Pricing matrix', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);

    await db
      .collection('countries')
      .insertOne({ _id: 'gb', isoCode: 'GB', isActive: true, defaultCurrencyCode: 'GBP' });
    await db.collection('currencies').updateOne({ isoCode: 'GBP' }, { $set: { isActive: true } });
    await db.collection('products').updateOne(
      { _id: 'simpleproduct' },
      {
        $push: {
          'commerce.pricing': {
            $each: [
              { countryCode: 'DE', currencyCode: 'EUR' },
              { countryCode: 'GB', currencyCode: 'GBP' },
            ].map((locale) => ({
              ...locale,
              amount: 10000,
              minQuantity: 0,
              isTaxable: true,
              isNetPrice: false,
            })),
          },
        },
      },
    );

    if (!pluginRegistry.hasPlugin('shop.unchained.tests.pricing-matrix')) {
      pluginRegistry.register({
        key: 'shop.unchained.tests.pricing-matrix',
        label: 'Pricing matrix',
        version: '1.0.0',
        adapters: [
          fee(DeliveryPricingAdapter, 'shop.unchained.tests.delivery-fee', 1000, true),
          fee(PaymentPricingAdapter, 'shop.unchained.tests.payment-fee', 150, false),
          ...[
            ProductEuTaxPlugin,
            DeliveryEuTaxPlugin,
            PaymentEuTaxPlugin,
            ProductUkTaxPlugin,
            DeliveryUkTaxPlugin,
            PaymentUkTaxPlugin,
          ].flatMap((plugin) => plugin.adapters.map(whileActive)),
        ],
      });
    }
    active = true;
  });

  test.after(async () => {
    active = false;
    await disconnect();
  });

  for (const [index, scenario] of scenarios.entries()) {
    test(scenario.name, async () => {
      const order = await createCart(scenario, index);
      const { expected } = scenario;

      assertPricePair('Order.total', order.total, order.totalNet, expected.total);
      assertPricePair('Order.total(ITEMS)', order.itemsTotal, order.itemsNet, expected.items);
      assertPricePair(
        'Order.total(DELIVERY)',
        order.deliveryTotal,
        order.deliveryNet,
        expected.delivery,
      );
      assertPricePair('Order.total(PAYMENT)', order.paymentTotal, order.paymentNet, expected.payment);
      assert.deepStrictEqual(
        [order.discountsTotal.amount, order.discountsNet.amount],
        expected.discounts,
        'Order.total(DISCOUNTS)',
      );
      assert.equal(order.taxes.amount, expected.taxes, 'Order.total(TAXES)');

      // the categories add up to the order total, the taxes are gross minus net
      const sum = (...prices) => prices.reduce((acc, { amount }) => acc + amount, 0);
      const near = (actual, wanted, label) => assert.ok(Math.abs(actual - wanted) <= 1, label);
      near(
        sum(order.itemsTotal, order.deliveryTotal, order.paymentTotal, order.discountsTotal),
        order.total.amount,
        'gross sum',
      );
      near(
        sum(order.itemsNet, order.deliveryNet, order.paymentNet, order.discountsNet),
        order.totalNet.amount,
        'net sum',
      );
      near(order.total.amount - order.totalNet.amount, order.taxes.amount, 'taxes');

      // fees and simulated fees are the gross amounts the order charges
      assert.deepStrictEqual(order.delivery.fee, order.deliveryTotal, 'OrderDelivery.fee');
      assert.deepStrictEqual(order.payment.fee, order.paymentTotal, 'OrderPayment.fee');
      assertPricePair(
        'DeliveryProvider.simulatedPrice',
        order.delivery.provider.simulatedPrice,
        order.delivery.provider.simulatedPriceNet,
        expected.delivery,
      );
      assertPricePair(
        'PaymentProvider.simulatedPrice',
        order.payment.provider.simulatedPrice,
        order.payment.provider.simulatedPriceNet,
        expected.payment,
      );

      const [item] = order.items;
      if (item) {
        const discount = expected.itemDiscount || 0;
        assertPricePair('OrderItem.total', item.total, item.totalNet, expected.items);
        assert.equal(item.unitPrice.amount * item.quantity, expected.items[0], 'OrderItem.unitPrice');
        assert.equal(item.unitPrice.isTaxable, item.total.isTaxable, 'OrderItem.unitPrice isTaxable');
        assert.equal(item.unitPriceNet.isNetPrice, true, 'OrderItem.unitPrice net');
        assert.deepStrictEqual(
          item.discounts.map(({ total }) => total),
          discount ? [price(discount, true, false)] : [],
          'OrderItemDiscount.total',
        );
      }

      assert.deepStrictEqual(
        order.discounts.map(({ total, totalNet }) => [total, totalNet]),
        expected.orderDiscount
          ? [
              [
                price(expected.orderDiscount[0], true, false),
                price(expected.orderDiscount[1], true, true),
              ],
            ]
          : [],
        'OrderDiscount.total',
      );
    });
  }
});
