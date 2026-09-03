import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  BasePricingSheet,
  DeliveryPricingSheet,
  OrderPricingRowCategory,
  OrderPricingSheet,
  PaymentPricingSheet,
  ProductPricingSheet,
  type IOrderPricingAdapter,
  type OrderPricingCalculation,
} from '@unchainedshop/core';
import type { PricingCalculation } from '@unchainedshop/utils';
import { OrderDelivery } from './order-delivery/adapter.ts';
import { OrderDiscount } from './order-discount/adapter.ts';
import { OrderItems } from './order-items/adapter.ts';
import { OrderPayment } from './order-payment/adapter.ts';

const currencyCode = 'CHF';

const productCalculation = [
  {
    category: 'ITEM',
    amount: 10_000,
    isTaxable: true,
    isNetPrice: false,
  },
  {
    category: 'ITEM',
    amount: -715,
    isTaxable: false,
    isNetPrice: false,
  },
  {
    category: 'TAX',
    baseCategory: 'ITEM',
    amount: 715,
    isTaxable: false,
    isNetPrice: false,
    rate: 0.077,
  },
];

const deliveryCalculation = [
  {
    category: 'DELIVERY',
    amount: 2_000,
    isTaxable: true,
    isNetPrice: false,
  },
  {
    category: 'DELIVERY',
    amount: -143,
    isTaxable: false,
    isNetPrice: false,
  },
  {
    category: 'TAX',
    baseCategory: 'DELIVERY',
    amount: 143,
    isTaxable: false,
    isNetPrice: false,
    rate: 0.077,
  },
];

const paymentCalculation = [
  {
    category: 'PAYMENT',
    amount: 500,
    isTaxable: true,
    isNetPrice: false,
  },
  {
    category: 'PAYMENT',
    amount: -36,
    isTaxable: false,
    isNetPrice: false,
  },
  {
    category: 'TAX',
    baseCategory: 'PAYMENT',
    amount: 36,
    isTaxable: false,
    isNetPrice: false,
    rate: 0.077,
  },
];

const productPricing = () =>
  ProductPricingSheet({ calculation: productCalculation, currencyCode, quantity: 1 });

const deliveryPricing = () => DeliveryPricingSheet({ calculation: deliveryCalculation, currencyCode });

const paymentPricing = () => PaymentPricingSheet({ calculation: paymentCalculation, currencyCode });

const baseContext = () => ({
  currencyCode,
  discounts: [],
  order: { _id: 'order', currencyCode },
  orderPositions: [],
  orderDelivery: null,
  orderPayment: null,
});

const runOrderAdapter = async (
  adapter: IOrderPricingAdapter,
  context: Record<string, unknown>,
  calculation: OrderPricingCalculation[] = [],
) => {
  const actions = adapter.actions({
    context: { ...baseContext(), ...context },
    calculationSheet: OrderPricingSheet({ calculation, currencyCode }),
    discounts: [],
  } as any);

  const rows = await actions.calculate();
  assert.ok(rows, 'adapter should return calculation rows');
  return rows;
};

const assertLiftedTotalsMatch = ({ source, order, category }) => {
  assert.equal(order.gross(), source.gross(), 'gross() must survive lifting to the order');
  assert.equal(order.net(), source.net(), 'net() must survive lifting to the order');
  assert.deepEqual(
    order.total({ useNetPrice: false }),
    source.total({ useNetPrice: false }),
    'gross total() must survive lifting to the order',
  );
  assert.deepEqual(
    order.total({ useNetPrice: true }),
    source.total({ useNetPrice: true }),
    'net total() must survive lifting to the order',
  );
  assert.deepEqual(
    order.total({ category, useNetPrice: false }),
    source.total({ useNetPrice: false }),
    'gross category total must match the source sheet',
  );
  assert.deepEqual(
    order.total({ category, useNetPrice: true }),
    source.total({ useNetPrice: true }),
    'net category total must match the source sheet',
  );
};

describe('order pricing contracts', () => {
  test('lifts taxable product pricing without changing public totals', async () => {
    const source = productPricing();
    const rows = await runOrderAdapter(OrderItems, {
      orderPositions: [{ calculation: productCalculation, quantity: 1 }],
    });
    const order = OrderPricingSheet({ calculation: rows, currencyCode });

    assertLiftedTotalsMatch({ source, order, category: OrderPricingRowCategory.Items });
  });

  test('lifts taxable delivery pricing without changing public totals', async () => {
    const source = deliveryPricing();
    const rows = await runOrderAdapter(OrderDelivery, {
      orderDelivery: { calculation: deliveryCalculation },
    });
    const order = OrderPricingSheet({ calculation: rows, currencyCode });

    assertLiftedTotalsMatch({ source, order, category: OrderPricingRowCategory.Delivery });
  });

  test('lifts taxable payment pricing without changing public totals', async () => {
    const source = paymentPricing();
    const rows = await runOrderAdapter(OrderPayment, {
      orderPayment: { calculation: paymentCalculation },
    });
    const order = OrderPricingSheet({ calculation: rows, currencyCode });

    assertLiftedTotalsMatch({ source, order, category: OrderPricingRowCategory.Payment });
  });

  test('applies a fixed order discount to the gross total exactly once', async () => {
    const itemRows = await runOrderAdapter(OrderItems, {
      orderPositions: [{ calculation: productCalculation, quantity: 1 }],
    });
    const actions = OrderDiscount.actions({
      context: {
        ...baseContext(),
        orderPositions: [{ calculation: productCalculation, quantity: 1 }],
      },
      calculationSheet: OrderPricingSheet({ calculation: itemRows, currencyCode }),
      discounts: [{ configuration: { fixedRate: 1_000 }, discountId: 'fixed-10' }],
    } as any);
    const discountRows = await actions.calculate();
    assert.ok(discountRows, 'discount adapter should return calculation rows');

    const order = OrderPricingSheet({
      calculation: itemRows.concat(discountRows),
      currencyCode,
    });

    assert.equal(order.gross(), productPricing().gross() - 1_000);
    assert.deepEqual(order.total({ useNetPrice: false }), {
      amount: productPricing().gross() - 1_000,
      currencyCode,
    });
    assert.deepEqual(order.discountPrices('fixed-10'), [
      { amount: -1_000, currencyCode, discountId: 'fixed-10' },
    ]);
  });

  test('keeps the public calculation property authoritative', () => {
    const sheet = BasePricingSheet<PricingCalculation>({ calculation: [], currencyCode });
    const replacement = [{ category: 'ITEM', amount: 100 }];

    sheet.calculation = replacement;

    assert.equal(sheet.isValid(), true);
    assert.strictEqual(sheet.getRawPricingSheet(), replacement);
    assert.deepEqual(sheet.filterBy(), replacement);
    assert.equal(sheet.sum(), 100);
  });

  test('continues to interpret persisted pre-change order rows consistently', () => {
    const sheet = OrderPricingSheet({
      calculation: [
        { category: OrderPricingRowCategory.Items, amount: 10_000 },
        {
          category: OrderPricingRowCategory.Taxes,
          baseCategory: OrderPricingRowCategory.Items,
          amount: 715,
        },
      ],
      currencyCode,
    });

    assert.equal(sheet.gross(), 10_000);
    assert.equal(sheet.net(), 9_285);
    assert.deepEqual(sheet.total({ useNetPrice: false }), { amount: 10_000, currencyCode });
    assert.deepEqual(sheet.total({ useNetPrice: true }), { amount: 9_285, currencyCode });
  });
});
