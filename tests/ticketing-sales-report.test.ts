import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import seedTicketing, {
  ConcertEventId,
  GATE_TOKEN,
  TheaterEventId,
  buyTickets,
} from './seeds/ticketing.js';

const SALES_REPORT = /* GraphQL */ `
  query SalesReport($from: DateTimeISO!, $to: DateTimeISO!) {
    ticketSalesReport(from: $from, to: $to) {
      orders {
        orderNumber
        tickets
        items
        total
        currencyCode
        emailAddress
        billingName
        paymentAdapterKey
      }
      performances {
        productId
        title
        tickets
        items
        currencyCode
      }
      paymentProviders {
        adapterKey
        orders
        tickets
        total
      }
      totals {
        currencyCode
        orders
        tickets
        total
      }
    }
  }
`;

test.describe('Ticketing: sales report', () => {
  let adminFetch;
  let staffFetch;
  const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const to = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  test.before(async () => {
    const [db] = await setupDatabase();
    await seedTicketing(db);
    adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    staffFetch = createLoggedInGraphqlFetch(GATE_TOKEN);
    const userFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    await buyTickets(userFetch, {
      orderNumber: 'report-1',
      positions: [
        { productId: ConcertEventId, quantity: 2 },
        { productId: TheaterEventId, quantity: 1 },
      ],
    });
  });

  test('the report lists the orders, performances and payment providers of the period', async () => {
    const { data, errors } = await adminFetch({ query: SALES_REPORT, variables: { from, to } });
    assert.ifError(errors?.[0]);
    const report = data.ticketSalesReport;

    const [order] = report.orders.filter(({ orderNumber }) => orderNumber === 'report-1');
    assert.deepEqual(
      { ...order, total: undefined },
      {
        orderNumber: 'report-1',
        tickets: 3,
        items: 15000,
        total: undefined,
        currencyCode: 'CHF',
        emailAddress: 'buyer@unchained.local',
        billingName: 'Ada Lovelace',
        paymentAdapterKey: 'shop.unchained.invoice',
      },
    );
    assert.ok(order.total >= order.items);
    assert.deepEqual(
      report.performances.map(({ productId, title, tickets, items }) => ({
        productId,
        title,
        tickets,
        items,
      })),
      [
        { productId: ConcertEventId, title: 'Konzert', tickets: 2, items: 10000 },
        { productId: TheaterEventId, title: 'Theater', tickets: 1, items: 5000 },
      ],
    );
    assert.deepEqual(report.paymentProviders, [
      { adapterKey: 'shop.unchained.invoice', orders: 1, tickets: 3, total: order.total },
    ]);
    assert.deepEqual(report.totals, [
      { currencyCode: 'CHF', orders: 1, tickets: 3, total: order.total },
    ]);
  });

  test('orders outside of the period are left out', async () => {
    const { data, errors } = await adminFetch({
      query: SALES_REPORT,
      variables: { from: '2020-01-01T00:00:00.000Z', to: '2020-02-01T00:00:00.000Z' },
    });
    assert.ifError(errors?.[0]);
    assert.deepEqual(data.ticketSalesReport.totals, []);
  });

  test('gate staff may not see the sales report', async () => {
    const { errors } = await staffFetch({ query: SALES_REPORT, variables: { from, to } });
    assert.equal(errors?.[0]?.extensions?.code, 'NoPermissionError');
  });
});
