import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TicketSalesReportWorker } from './sales-report-worker.ts';
import { resolveTicketSalesReportTemplate } from './templates/resolveTicketSalesReportTemplate.ts';

const apiWith = (orders: any[], work: any[]) =>
  ({
    modules: {
      orders: {
        findOrders: async () => orders,
        payments: { findOrderPayments: async () => [] },
        positions: { findOrderPositions: async () => [] },
      },
      payment: { paymentProviders: { findProviders: async () => [] } },
      products: { findProducts: async () => [] },
      worker: { addWork: async (input: any) => work.push(input) },
    },
  }) as any;

const period = { from: '2030-01-01T00:00:00.000Z', to: '2030-01-02T00:00:00.000Z' };

test('the worker e-mails the report of a period with orders to the recipients', async () => {
  const work: any[] = [];
  const order = {
    _id: 'o1',
    orderNumber: 'A1',
    ordered: new Date('2030-01-01T10:00:00.000Z'),
    currencyCode: 'CHF',
    calculation: [{ category: 'ITEMS', amount: 5000 }],
  };
  const result = await TicketSalesReportWorker.doWork(
    { ...period, recipients: ['office@example.com'] },
    apiWith([order], work),
    'work',
  );
  assert.equal(result.success, true);
  assert.equal(result.result.sent, true);
  assert.equal(work.length, 1);
  assert.equal(work[0].type, 'MESSAGE');
  assert.equal(work[0].input.template, 'TICKET_SALES_REPORT');
  assert.match(work[0].input.csv.orders, /\r\nA1,/);

  const [email] = await resolveTicketSalesReportTemplate(work[0].input, {} as any);
  assert.equal(email.input.to, 'office@example.com');
  assert.match(email.input.text, /CHF: 1 orders, 0 tickets, 50 CHF/);
  assert.equal(email.input.attachments.length, 3);
  assert.match(
    Buffer.from(email.input.attachments[0].content, 'base64').toString('utf8'),
    /^\uFEFForderNumber,/,
  );
});

test('the worker sends nothing without recipients or orders', async () => {
  const work: any[] = [];
  const empty = await TicketSalesReportWorker.doWork(
    { ...period, recipients: ['office@example.com'] },
    apiWith([], work),
    'w',
  );
  assert.equal(empty.result.sent, false);
  const silent = await TicketSalesReportWorker.doWork(period, apiWith([], work), 'w');
  assert.equal(silent.result.sent, false);
  assert.equal(work.length, 0);
});
