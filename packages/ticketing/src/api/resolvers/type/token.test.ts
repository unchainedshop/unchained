import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Token } from './token.ts';
import { TokenizedProduct } from './tokenized-product.ts';

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

test('ticket events expose their start, end, doors, location and category', () => {
  const product = {
    _id: 'event',
    tokenization: {
      ercMetadataProperties: {
        slot: '2026-10-01T19:00:00.000Z',
        location: 'Theater',
        durationMinutes: 90,
        doorsOpenMinutesBefore: 30,
        category: 'Parkett',
      },
    },
    meta: { cancelled: true },
  } as any;
  assert.deepEqual(TokenizedProduct.eventStartsAt(product), new Date('2026-10-01T19:00:00Z'));
  assert.deepEqual(TokenizedProduct.eventEndsAt(product), new Date('2026-10-01T20:30:00Z'));
  assert.deepEqual(TokenizedProduct.eventDoorsOpenAt(product), new Date('2026-10-01T18:30:00Z'));
  assert.equal(TokenizedProduct.eventLocation(product), 'Theater');
  assert.equal(TokenizedProduct.eventCategory(product), 'Parkett');
  assert.equal(TokenizedProduct.isCanceled(product), true);

  const unscheduled = { _id: 'nft', tokenization: { ercMetadataProperties: { slot: 'soon' } } } as any;
  for (const field of [
    'eventStartsAt',
    'eventEndsAt',
    'eventDoorsOpenAt',
    'eventLocation',
    'eventCategory',
  ] as const) {
    assert.equal(TokenizedProduct[field](unscheduled), null, field);
  }
  assert.equal(TokenizedProduct.isCanceled(unscheduled), false);
});
