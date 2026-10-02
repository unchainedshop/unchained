import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  attendeesValue,
  buildBoxOfficeItems,
  findBoxOfficeProvider,
  groupPerformances,
  saleErrorCode,
} from './box-office.ts';

const performance = (id: string, startsAt: string, categoryTitle: string) => ({
  _id: id,
  texts: { title: 'Hamlet' },
  event: { startsAt, location: 'Main hall', categoryTitle },
});

test('events of one performance are sold together', () => {
  const events = [
    performance('a', '2030-01-01T19:00:00Z', 'Stalls'),
    performance('b', '2030-01-01T19:00:00Z', 'Balcony'),
    performance('c', '2030-01-02T19:00:00Z', 'Stalls'),
  ];
  assert.deepEqual(
    groupPerformances(events).map((group) => group.map(({ _id }) => _id)),
    [['a', 'b'], ['c']],
  );
});

test('attendee names become the attendees configuration, one per seat', () => {
  assert.equal(attendeesValue(['Ada', '', 'Alan, Jr.'], 3), 'Ada, , Alan Jr.');
  assert.equal(attendeesValue(['Ada', 'Grace', 'extra'], 2), 'Ada, Grace');
  assert.equal(attendeesValue([' ', undefined], 2), null);
  assert.deepEqual(buildBoxOfficeItems({ a: 2, b: 0, c: 1 }, { a: ['Ada'] }), [
    { productId: 'a', quantity: 2, configuration: [{ key: 'attendees', value: 'Ada, ' }] },
    { productId: 'c', quantity: 1 },
  ]);
});

test('the box office provider and sale errors are found', () => {
  assert.deepEqual(
    findBoxOfficeProvider([
      { _id: 'card', interface: { _id: 'shop.unchained.payment.card' } },
      { _id: 'box', interface: { _id: 'shop.unchained.payment.box-office' } },
    ]),
    { _id: 'box', interface: { _id: 'shop.unchained.payment.box-office' } },
  );
  assert.equal(findBoxOfficeProvider([]), null);
  assert.equal(
    saleErrorCode({
      errors: [{ extensions: { code: 'OrderCheckoutError', detailCode: 'TicketSoldOutError' } }],
    }),
    'TicketSoldOutError',
  );
  assert.equal(saleErrorCode({ errors: [{ extensions: { code: 'NoPermissionError' } }] }), null);
});
