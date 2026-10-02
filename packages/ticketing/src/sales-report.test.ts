import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTicketSalesReport } from './sales-report.ts';
import { buildSalesReportCsv, toDecimalAmount } from './sales-report-csv.ts';

const from = new Date('2030-01-01T00:00:00.000Z');
const to = new Date('2030-01-02T00:00:00.000Z');

const orderCalculation = (items: number, discounts = 0, delivery = 0) => [
  { category: 'ITEMS', amount: items },
  ...(discounts ? [{ category: 'DISCOUNTS', amount: discounts }] : []),
  ...(delivery ? [{ category: 'DELIVERY', amount: delivery }] : []),
];

const orders = [
  {
    _id: 'o1',
    orderNumber: 'A1',
    ordered: new Date('2030-01-01T10:00:00.000Z'),
    currencyCode: 'CHF',
    paymentId: 'p1',
    contact: { emailAddress: 'ada@example.com' },
    billingAddress: { firstName: 'Ada', lastName: 'Lovelace' },
    calculation: orderCalculation(8000, -1000, 500),
  },
  {
    _id: 'o2',
    orderNumber: 'A2',
    ordered: new Date('2030-01-01T11:00:00.000Z'),
    currencyCode: 'CHF',
    paymentId: 'p2',
    calculation: orderCalculation(3000),
  },
  {
    _id: 'o3',
    orderNumber: 'B1',
    ordered: new Date('2030-01-01T12:00:00.000Z'),
    currencyCode: 'EUR',
    paymentId: 'p2',
    calculation: orderCalculation(2000),
  },
  // placed exactly at "to": belongs to the next period
  {
    _id: 'late',
    ordered: to,
    currencyCode: 'CHF',
    calculation: orderCalculation(100),
  },
];

const positions = [
  {
    orderId: 'o1',
    productId: 'balcony',
    quantity: 2,
    calculation: [{ category: 'ITEM', amount: 6000 }],
  },
  {
    orderId: 'o1',
    productId: 'program',
    quantity: 1,
    calculation: [{ category: 'ITEM', amount: 2000 }],
  },
  {
    orderId: 'o2',
    productId: 'balcony',
    quantity: 1,
    calculation: [
      { category: 'ITEM', amount: 3000 },
      { category: 'DISCOUNT', amount: -500 },
    ],
  },
  { orderId: 'o3', productId: 'stalls', quantity: 1, calculation: [{ category: 'ITEM', amount: 2000 }] },
];

const products = [
  {
    _id: 'balcony',
    type: 'TOKENIZED_PRODUCT',
    meta: { slot: '2030-03-01T19:00:00.000Z', category: 'balcony' },
  },
  { _id: 'stalls', type: 'TOKENIZED_PRODUCT', meta: { slot: '2030-02-01T19:00:00.000Z' } },
  // Not a ticket: sold with the tickets, counted in the order totals only
  { _id: 'program', type: 'SIMPLE_PRODUCT', meta: {} },
];

const api = {
  modules: {
    orders: {
      findOrders: async (query: any) => {
        assert.deepEqual(query.status, ['CONFIRMED', 'FULFILLED']);
        return orders.filter(
          ({ ordered }) =>
            ordered >= new Date(query.dateRange.start) && ordered <= new Date(query.dateRange.end),
        );
      },
      payments: {
        findOrderPayments: async ({ orderPaymentIds }: any) =>
          orderPaymentIds.map((_id: string) => ({
            _id,
            paymentProviderId: _id === 'p1' ? 'card' : 'box',
          })),
      },
      positions: {
        findOrderPositions: async ({ orderIds }: any) =>
          positions.filter(({ orderId }) => orderIds.includes(orderId)),
      },
    },
    payment: {
      paymentProviders: {
        findProviders: async ({ paymentProviderIds, includeDeleted }: any) => {
          assert.equal(includeDeleted, true);
          return paymentProviderIds.map((_id: string) => ({ _id, adapterKey: `adapter.${_id}` }));
        },
      },
    },
    products: {
      findProducts: async ({ productIds }: any) =>
        products.filter(({ _id }) => productIds.includes(_id)),
      firstActiveProductProxy: async () => null,
      texts: {
        findLocalizedText: async ({ productId }: any) => ({ title: `Title ${productId}` }),
      },
    },
  },
} as any;

test('the sales report sums orders, performances and providers per currency', async () => {
  const report = await buildTicketSalesReport(api, { from, to });

  assert.deepEqual(
    report.orders.map(
      ({ orderNumber, tickets, items, discounts, delivery, total, paymentAdapterKey }) => ({
        orderNumber,
        tickets,
        items,
        discounts,
        delivery,
        total,
        paymentAdapterKey,
      }),
    ),
    [
      {
        orderNumber: 'A1',
        tickets: 2,
        items: 8000,
        discounts: -1000,
        delivery: 500,
        total: 7500,
        paymentAdapterKey: 'adapter.card',
      },
      {
        orderNumber: 'A2',
        tickets: 1,
        items: 3000,
        discounts: 0,
        delivery: 0,
        total: 3000,
        paymentAdapterKey: 'adapter.box',
      },
      {
        orderNumber: 'B1',
        tickets: 1,
        items: 2000,
        discounts: 0,
        delivery: 0,
        total: 2000,
        paymentAdapterKey: 'adapter.box',
      },
    ],
  );
  assert.equal(report.orders[0].billingName, 'Ada Lovelace');
  assert.equal(report.orders[0].emailAddress, 'ada@example.com');

  // Sorted by event start, the category name falls back to the stored value without a production
  assert.deepEqual(
    report.performances.map(
      ({ productId, title, categoryTitle, currencyCode, tickets, items, discounts }) => ({
        productId,
        title,
        categoryTitle,
        currencyCode,
        tickets,
        items,
        discounts,
      }),
    ),
    [
      {
        productId: 'stalls',
        title: 'Title stalls',
        categoryTitle: undefined,
        currencyCode: 'EUR',
        tickets: 1,
        items: 2000,
        discounts: 0,
      },
      {
        productId: 'balcony',
        title: 'Title balcony',
        categoryTitle: 'balcony',
        currencyCode: 'CHF',
        tickets: 3,
        items: 9000,
        discounts: -500,
      },
    ],
  );

  assert.deepEqual(report.paymentProviders, [
    {
      paymentProviderId: 'card',
      adapterKey: 'adapter.card',
      currencyCode: 'CHF',
      orders: 1,
      tickets: 2,
      total: 7500,
    },
    {
      paymentProviderId: 'box',
      adapterKey: 'adapter.box',
      currencyCode: 'CHF',
      orders: 1,
      tickets: 1,
      total: 3000,
    },
    {
      paymentProviderId: 'box',
      adapterKey: 'adapter.box',
      currencyCode: 'EUR',
      orders: 1,
      tickets: 1,
      total: 2000,
    },
  ]);
  assert.deepEqual(report.totals, [
    { currencyCode: 'CHF', orders: 2, tickets: 3, items: 11000, discounts: -1000, total: 10500 },
    { currencyCode: 'EUR', orders: 1, tickets: 1, items: 2000, discounts: 0, total: 2000 },
  ]);
});

test('the sales report refuses invalid dates', async () => {
  await assert.rejects(buildTicketSalesReport(api, { from: 'yesterday', to }), /Invalid from date/);
});

test('the CSV files carry decimal amounts and keep negative numbers as numbers', async () => {
  const csv = buildSalesReportCsv(await buildTicketSalesReport(api, { from, to }));
  const [header, first] = csv.orders.split('\r\n');
  assert.equal(
    header,
    'orderNumber,ordered,email,phone,billingName,paymentProvider,currency,tickets,items,discounts,delivery,payment,total',
  );
  assert.equal(
    first,
    'A1,2030-01-01T10:00:00.000Z,ada@example.com,,Ada Lovelace,adapter.card,CHF,2,80,-10,5,0,75',
  );
  assert.match(
    csv.performances,
    /\r\nbalcony,Title balcony,2030-03-01T19:00:00.000Z,balcony,CHF,3,90,-5\r\n/,
  );
  assert.match(csv.paymentProviders, /\r\nbox,adapter.box,EUR,1,1,20\r\n/);
  assert.equal(toDecimalAmount(1234, 'JPY'), 1234);
  assert.equal(toDecimalAmount(1234, 'ETH'), 12.34);
});
