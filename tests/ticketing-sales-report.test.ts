import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MessagingDirector } from '@unchainedshop/core';
import { TicketSalesReportWorker } from '@unchainedshop/ticketing';
import { setupDatabase, createLoggedInGraphqlFetch, waitForWork } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { ConfirmedOrder } from './seeds/orders.js';
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

const reportMessage = { type: 'MESSAGE', 'input.template': 'TICKET_SALES_REPORT' };

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

    const { total, ...order } = report.orders.find(({ orderNumber }) => orderNumber === 'report-1');
    assert.deepEqual(order, {
      orderNumber: 'report-1',
      tickets: 3,
      items: 15000,
      currencyCode: 'CHF',
      emailAddress: 'buyer@unchained.local',
      billingName: 'Ada Lovelace',
      paymentAdapterKey: 'shop.unchained.invoice',
    });
    assert.ok(total >= order.items);
    assert.deepEqual(report.performances, [
      { productId: ConcertEventId, title: 'Konzert', tickets: 2, items: 10000, currencyCode: 'CHF' },
      { productId: TheaterEventId, title: 'Theater', tickets: 1, items: 5000, currencyCode: 'CHF' },
    ]);
    assert.deepEqual(report.paymentProviders, [
      { adapterKey: 'shop.unchained.invoice', orders: 1, tickets: 3, total },
    ]);
    assert.deepEqual(report.totals, [{ currencyCode: 'CHF', orders: 1, tickets: 3, total }]);
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

  test('the worker sends nothing without recipients or orders', async () => {
    const { unchainedAPI, db } = getTestPlatform();
    const messages = db.collection('work_queue');
    const before = await messages.countDocuments(reportMessage);
    for (const input of [
      { from, to },
      { from: '2010-01-01', to: '2010-01-02', recipients: ['office@example.test'] },
    ]) {
      const result = await TicketSalesReportWorker.doWork(input, unchainedAPI, 'report');
      assert.equal(result.result.sent, false);
    }
    assert.equal(await messages.countDocuments(reportMessage), before);
  });

  test('the worker uses live currency settings for the report summary and its CSV attachments', async () => {
    const { unchainedAPI, db } = getTestPlatform();
    const ordered = new Date('2018-01-01T12:00:00Z');
    const orders = ['CHF', 'ETH', 'JPY'].map((currencyCode) => ({
      ...ConfirmedOrder,
      _id: `report-${currencyCode}`,
      orderNumber: currencyCode,
      currencyCode,
      ordered,
      calculation: [{ category: 'ITEMS', amount: 5000 }],
    }));
    await db.collection('orders').insertMany(orders);
    await db.collection('currencies').updateOne({ isoCode: 'CHF' }, { $set: { decimals: 3 } });
    await db.collection('currencies').insertOne({ isoCode: 'ETH', decimals: 18, isActive: false });

    const input = {
      from: '2018-01-01',
      to: '2018-01-02',
      locale: 'de-DE',
      recipients: ['office@example.test'],
    };
    const result = await TicketSalesReportWorker.doWork(input, unchainedAPI, 'report');
    assert.equal(result.result.sent, true);
    const work = await db.collection('work_queue').findOne(reportMessage);
    assert.deepEqual(work.input.currencyDecimals, { CHF: 3, ETH: 9 });
    await db.collection('currencies').updateOne({ isoCode: 'CHF' }, { $set: { decimals: 2 } });

    await waitForWork(adminFetch, work._id, { status: ['SUCCESS'] });
    const email = await db.collection('work_queue').findOne({ type: 'EMAIL', originalWorkId: work._id });
    await waitForWork(adminFetch, email._id);
    assert.equal(email.input.to, 'office@example.test');
    assert.equal(email.input.attachments.length, 3);
    const csv = Buffer.from(email.input.attachments[0].content, 'base64').toString('utf8');
    assert.match(csv, /^\uFEFForderNumber,/);
    const rows = csv.split('\r\n');
    for (const [code, formatted, csvTotal] of [
      ['CHF', '5,000', '5'],
      ['ETH', '0,000005000', '0.000005'],
      ['JPY', '5.000', '5000'],
    ]) {
      const summary = `${code}: 1 orders, 0 tickets, ${formatted}\u00a0${code}`;
      const csvRow = rows.find((row) => row.startsWith(`${code},`));
      assert.ok(email.input.text.includes(summary), email.input.text);
      assert.equal(csvRow?.split(',').at(-1), csvTotal);
    }
  });

  test('previously queued reports use the ISO precision of their existing attachments', async () => {
    const [email] = await MessagingDirector.getTemplate('TICKET_SALES_REPORT')(
      {
        template: 'TICKET_SALES_REPORT',
        from,
        to,
        recipients: ['office@example.test'],
        totals: [{ currencyCode: 'JPY', orders: 1, tickets: 1, total: 5000, items: 5000, discounts: 0 }],
        csv: { orders: 'total\r\n5000\r\n', performances: '', paymentProviders: '' },
      },
      getTestPlatform().unchainedAPI,
    );
    assert.match(email.input.text, /JPY\u00a05,000/);
  });
});
