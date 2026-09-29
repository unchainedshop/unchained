import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TicketEventProperty,
  getTicketEventDetails,
  getTicketEventStart,
  isTicketCancelled,
  isTicketEventCancelled,
} from './event-details.ts';

const event = (ercMetadataProperties?: Record<string, unknown>, meta?: Record<string, unknown>) =>
  ({
    _id: 'event',
    type: 'TOKENIZED_PRODUCT',
    meta,
    tokenization: ercMetadataProperties ? { supply: 10, ercMetadataProperties } : undefined,
  }) as any;

test('event details are read from the public event properties of the tokenization', () => {
  const details = getTicketEventDetails(
    event({
      [TicketEventProperty.START]: '2026-10-01T18:00:00.000Z',
      [TicketEventProperty.LOCATION]: 'Main stage',
      [TicketEventProperty.DURATION_MINUTES]: '90',
      [TicketEventProperty.DOORS_OPEN_MINUTES_BEFORE]: 30,
      [TicketEventProperty.CATEGORY]: 'Premiere',
    }),
  );
  assert.deepEqual(details, {
    startsAt: new Date('2026-10-01T18:00:00.000Z'),
    endsAt: new Date('2026-10-01T19:30:00.000Z'),
    doorsOpenAt: new Date('2026-10-01T17:30:00.000Z'),
    location: 'Main stage',
    durationMinutes: 90,
    doorsOpenMinutesBefore: 30,
    category: 'Premiere',
  });
});

test('a stored Date works as well as an ISO string', () => {
  const slot = new Date('2026-10-01T18:00:00.000Z');
  assert.deepEqual(getTicketEventDetails(event({ slot })).startsAt, slot);
});

test('the start and the location fall back to the product meta', () => {
  assert.deepEqual(
    getTicketEventDetails(event(undefined, { slot: '2026-10-01T18:00:00.000Z', location: 'Hall' })),
    { startsAt: new Date('2026-10-01T18:00:00.000Z'), location: 'Hall' },
  );
  assert.deepEqual(
    getTicketEventDetails(event({ slot: '2026-12-24T18:00:00.000Z' }, { slot: '2026-10-01' })).startsAt,
    new Date('2026-12-24T18:00:00.000Z'),
  );
});

test('missing, empty and unparsable values are left out', () => {
  assert.deepEqual(getTicketEventDetails(undefined), {});
  assert.deepEqual(getTicketEventDetails(null), {});
  assert.deepEqual(getTicketEventDetails(event({})), {});
  assert.deepEqual(
    getTicketEventDetails(
      event({
        slot: 'next friday',
        location: '',
        durationMinutes: 'long',
        doorsOpenMinutesBefore: null,
      }),
    ),
    {},
  );
  // Without a start there is nothing to derive the end and the door opening from.
  assert.deepEqual(getTicketEventDetails(event({ durationMinutes: 60, doorsOpenMinutesBefore: 15 })), {
    durationMinutes: 60,
    doorsOpenMinutesBefore: 15,
  });
});

test('the raw event start keeps an unparsable slot as an invalid date', () => {
  assert.equal(getTicketEventStart(event({})), undefined);
  assert.equal(getTicketEventStart(event({ slot: '' })), undefined);
  assert.ok(Number.isNaN(getTicketEventStart(event({ slot: 'next friday' }))!.getTime()));
  assert.deepEqual(
    getTicketEventStart(event(undefined, { slot: '2026-10-01T18:00:00.000Z' })),
    new Date('2026-10-01T18:00:00.000Z'),
  );
});

test('cancellation flags are read from the meta of the event and of the ticket', () => {
  assert.equal(isTicketEventCancelled(event({}, { cancelled: true })), true);
  assert.equal(isTicketEventCancelled(event({})), false);
  assert.equal(isTicketEventCancelled(null), false);
  assert.equal(isTicketCancelled({ _id: 't', meta: { cancelled: true } } as any), true);
  assert.equal(isTicketCancelled({ _id: 't', meta: null } as any), false);
  assert.equal(isTicketCancelled(undefined), false);
});
