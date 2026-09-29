import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buyerLabel, matchesTicketFilter, csvCell, buildAttendeeCsv } from './attendees.ts';

test('buyerLabel shows Guest instead of the user id User.name falls back to', () => {
  assert.equal(buyerLabel({ _id: 'u1', name: 'Jane Doe' }, 'Guest'), 'Jane Doe');
  assert.equal(buyerLabel({ _id: 'u1', name: 'u1' }, 'Guest'), 'Guest');
  assert.equal(buyerLabel({ _id: 'u1', name: '' }, 'Guest'), 'Guest');
  assert.equal(buyerLabel({ _id: 'u1' }, 'Guest'), 'Guest');
  assert.equal(buyerLabel(null, 'Guest'), '');
});

test('matchesTicketFilter finds a ticket by serial, id, attendee or buyer', () => {
  const token = {
    _id: '65f1c0ffee0000000000abcd',
    tokenSerialNumber: '42',
    attendeeName: 'Anna Muster',
    user: { _id: 'u1', name: 'Jane Doe' },
  };
  for (const text of [
    '',
    '  ',
    '42',
    '#42',
    'abcd',
    '65F1C0FFEE0000000000ABCD',
    'anna',
    'MUSTER',
    'jane',
  ]) {
    assert.equal(matchesTicketFilter(token, text), true, text);
  }
  for (const text of ['43', 'Bob', 'u2']) {
    assert.equal(matchesTicketFilter(token, text), false, text);
  }
  assert.equal(matchesTicketFilter({ _id: 'x', user: null, attendeeName: null }, 'anna'), false);
});

test('csvCell quotes separators and defuses spreadsheet formulas', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('line\nbreak'), '"line\nbreak"');
  assert.equal(csvCell('a;b'), '"a;b"');
  assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(csvCell('+41 79'), "'+41 79");
  assert.equal(csvCell('-1'), "'-1");
  assert.equal(csvCell('@cmd'), "'@cmd");
  assert.equal(csvCell('\tx'), "'\tx");
  assert.equal(csvCell('=a,b'), `"'=a,b"`);
  assert.equal(csvCell(7), '7');
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(undefined), '');
});

test('buildAttendeeCsv exports what the viewer sees, redeemed only when not cancelled', () => {
  const csv = buildAttendeeCsv(
    [
      {
        _id: 't1',
        tokenSerialNumber: '1',
        attendeeName: 'Anna Muster',
        user: { _id: 'u1', name: 'Jane Doe' },
        ticketStatus: 'VALID',
        invalidatedDate: null,
        cancelledDate: null,
      },
      {
        _id: 't2',
        tokenSerialNumber: '2',
        attendeeName: null,
        user: { _id: 'u2', name: 'u2' },
        ticketStatus: 'REDEEMED',
        invalidatedDate: '2026-10-01T18:05:00.000Z',
      },
      {
        _id: 't3',
        tokenSerialNumber: '3',
        attendeeName: '=HYPERLINK("x")',
        user: null,
        ticketStatus: 'CANCELLED',
        invalidatedDate: '2026-09-30T10:00:00.000Z',
        cancelledDate: '2026-09-30T10:00:00.001Z',
      },
    ],
    {
      ticketId: 'Ticket ID',
      serial: 'Ticket #',
      attendee: 'Attendee',
      buyer: 'Buyer',
      status: 'Status',
      redeemedAt: 'Redeemed at',
      cancelledAt: 'Cancelled at',
      guest: 'Guest',
    },
  );
  assert.equal(
    csv,
    [
      'Ticket ID,Ticket #,Attendee,Buyer,Status,Redeemed at,Cancelled at',
      't1,1,Anna Muster,Jane Doe,VALID,,',
      't2,2,,Guest,REDEEMED,2026-10-01T18:05:00.000Z,',
      `t3,3,"'=HYPERLINK(""x"")",,CANCELLED,,2026-09-30T10:00:00.001Z`,
      '',
    ].join('\r\n'),
  );
});
