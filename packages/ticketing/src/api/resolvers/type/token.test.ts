import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Token } from './token.ts';
import { TicketEvent, TokenizedProduct } from './tokenized-product.ts';

const EVENT_FIELDS = [
  'startsAt',
  'endsAt',
  'doorsOpenAt',
  'location',
  'durationMinutes',
  'doorsOpenMinutesBefore',
  'category',
  'isCanceled',
  'cancelledDate',
] as const;

// Resolves the plain fields of TokenizedProduct.event like the GraphQL executor does
const resolveEvent = (product: any) => {
  const event = TokenizedProduct.event(product);
  return Object.fromEntries(EVENT_FIELDS.map((field) => [field, TicketEvent[field](event)]));
};

test('the ticket status tells cancelled tickets apart from redeemed ones', () => {
  const invalidatedDate = new Date('2026-10-01T19:05:00Z');
  const cancelledDate = new Date('2026-10-01T12:00:00Z');
  for (const [token, status] of [
    [{}, 'VALID'],
    [{ meta: { cancelled: false } }, 'VALID'],
    [{ invalidatedDate }, 'REDEEMED'],
    // Cancelling also sets invalidatedDate; a redeemed ticket that is cancelled later is cancelled.
    [{ invalidatedDate, meta: { cancelled: true, cancelledDate } }, 'CANCELLED'],
    [{ meta: { cancelled: true } }, 'CANCELLED'],
  ] as const) {
    assert.equal(Token.ticketStatus(token as any), status, JSON.stringify(token));
  }
  assert.equal(Token.isCanceled({ meta: { cancelled: true } } as any), true);
  assert.equal(Token.isCanceled({ meta: null } as any), false);
  assert.deepEqual(
    Token.cancelledDate({ meta: { cancelled: true, cancelledDate } } as any),
    cancelledDate,
  );
  assert.deepEqual(
    Token.cancelledDate({
      meta: { cancelled: true, cancelledDate: cancelledDate.toISOString() },
    } as any),
    cancelledDate,
  );
  assert.equal(Token.cancelledDate({ meta: { cancelled: true } } as any), null);
  assert.equal(Token.cancelledDate({ meta: { cancelledDate } } as any), null);
});

test('the attendee name comes from the ticket meta only', () => {
  assert.equal(Token.attendeeName({ meta: { attendeeName: ' Anna Muster ' } } as any), 'Anna Muster');
  for (const meta of [
    undefined,
    null,
    {},
    { attendeeName: '' },
    { attendeeName: '   ' },
    { attendeeName: 42 },
    { attendeeName: { first: 'Anna' } },
    // No fallback to anything else stored on the ticket or its buyer.
    { firstName: 'Anna', lastName: 'Muster', name: 'Anna Muster' },
  ]) {
    assert.equal(Token.attendeeName({ meta, userId: 'buyer' } as any), null, JSON.stringify(meta));
  }
});

test('ticket events expose every value from the product meta as TokenizedProduct.event', () => {
  const product = {
    _id: 'event',
    meta: {
      slot: '2026-10-01T19:00:00.000Z',
      location: 'Theater',
      durationMinutes: 90,
      doorsOpenMinutesBefore: 30,
      category: 'Parkett',
      cancelled: true,
      cancelledDate: '2026-09-30T08:00:00.000Z',
    },
  } as any;
  assert.deepEqual(resolveEvent(product), {
    startsAt: new Date('2026-10-01T19:00:00Z'),
    endsAt: new Date('2026-10-01T20:30:00Z'),
    doorsOpenAt: new Date('2026-10-01T18:30:00Z'),
    location: 'Theater',
    durationMinutes: 90,
    doorsOpenMinutesBefore: 30,
    category: 'Parkett',
    isCanceled: true,
    cancelledDate: new Date('2026-09-30T08:00:00Z'),
  });

  // Unset or unparsable values are null; the cancellation date only counts for a cancelled event.
  const unscheduled = { _id: 'nft', meta: { slot: 'soon', cancelledDate: new Date() } } as any;
  assert.deepEqual(resolveEvent(unscheduled), {
    startsAt: null,
    endsAt: null,
    doorsOpenAt: null,
    location: null,
    durationMinutes: null,
    doorsOpenMinutesBefore: null,
    category: null,
    isCanceled: false,
    cancelledDate: null,
  });
  assert.equal(resolveEvent({ _id: 'bare' }).isCanceled, false);
});

test('ticket events expose their own and their effective sale rules and the overridden details', async () => {
  const production = {
    _id: 'show',
    tags: ['ticket-production'],
    meta: { saleRules: { onSale: true, salesStart: '2026-10-01T08:00:00.000Z', maxPerOrder: 6 } },
  };
  let lookups = 0;
  const context = {
    modules: {
      products: {
        firstActiveProductProxy: async (productId: string) => {
          lookups += 1;
          assert.equal(productId, 'performance');
          return production;
        },
      },
    },
  } as any;
  const performance = {
    _id: 'performance',
    meta: { saleRules: { maxPerOrder: 2, salesEnd: 'not a date' }, overridden: ['location'] },
  } as any;
  const event = TokenizedProduct.event(performance);
  assert.deepEqual(TicketEvent.ownSaleRules(event), {
    onSale: null,
    salesStart: null,
    salesEnd: null,
    maxPerOrder: 2,
  });
  assert.deepEqual(await TicketEvent.saleRules(event, {}, context), {
    onSale: true,
    salesStart: new Date('2026-10-01T08:00:00.000Z'),
    salesEnd: null,
    maxPerOrder: 2,
  });
  // The production is looked up once per request
  await TicketEvent.saleRules(event, {}, context);
  assert.equal(lookups, 1);
  assert.deepEqual(TicketEvent.overridden(event), ['location']);
  assert.deepEqual(TicketEvent.overridden(TokenizedProduct.event({ _id: 'bare' } as any)), []);
});
