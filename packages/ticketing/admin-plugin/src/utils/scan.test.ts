import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkTicket,
  checkTicketCode,
  describeScanError,
  createRepeatGuard,
  getScanTone,
  redeemGateTicket,
} from './scan.ts';

const graphQLError = (code: string, extensions = {}, message = 'Refused') => ({
  errors: [{ message, extensions: { code, ...extensions } }],
});

test('checkTicket judges a looked-up ticket in the order scanTicket refuses it', () => {
  const ticket = {
    _id: 'ticket',
    ticketStatus: 'VALID',
    isInvalidateable: true,
    product: { _id: 'event', status: 'ACTIVE', isCanceled: false },
  };
  assert.deepEqual(checkTicket(ticket, { eventIds: ['event'] }), { verdict: 'VALID' });
  assert.deepEqual(checkTicket(ticket, {}), { verdict: 'VALID' });

  // Another event wins over every other state: this gate must not admit it at all.
  assert.deepEqual(checkTicket({ ...ticket, ticketStatus: 'CANCELLED' }, { eventIds: ['other'] }), {
    verdict: 'WRONG_EVENT',
    productId: 'event',
  });

  // Cancelling a ticket also sets invalidatedDate, so cancelled is checked before redeemed.
  assert.deepEqual(
    checkTicket(
      {
        ...ticket,
        ticketStatus: 'CANCELLED',
        invalidatedDate: '2026-09-30T10:00:00.000Z',
        cancelledDate: '2026-09-30T10:00:00.001Z',
      },
      { eventIds: ['event'] },
    ),
    { verdict: 'CANCELLED', scope: 'TICKET', date: '2026-09-30T10:00:00.001Z' },
  );
  assert.deepEqual(checkTicket({ ...ticket, ticketStatus: 'CANCELLED' }, {}), {
    verdict: 'CANCELLED',
    scope: 'TICKET',
  });
  assert.deepEqual(checkTicket({ ...ticket, product: { ...ticket.product, isCanceled: true } }, {}), {
    verdict: 'CANCELLED',
    scope: 'EVENT',
  });
  assert.deepEqual(
    checkTicket(
      { ...ticket, ticketStatus: 'REDEEMED', invalidatedDate: '2026-10-01T18:05:00.000Z' },
      {},
    ),
    { verdict: 'ALREADY_REDEEMED', date: '2026-10-01T18:05:00.000Z' },
  );
  assert.deepEqual(checkTicket({ ...ticket, product: { ...ticket.product, status: 'DRAFT' } }, {}), {
    verdict: 'NOT_REDEEMABLE',
    reason: 'EVENT_INACTIVE',
  });
  // The entry window is only explained by scanTicket; the lookup just knows it is closed now.
  assert.deepEqual(
    checkTicket(
      {
        ...ticket,
        isInvalidateable: false,
        product: { ...ticket.product, eventStartsAt: '2026-10-01T18:00:00.000Z' },
      },
      {},
    ),
    { verdict: 'NOT_REDEEMABLE', startsAt: '2026-10-01T18:00:00.000Z' },
  );
});

test('describeScanError turns scanTicket refusals into what gate staff need to know', () => {
  assert.deepEqual(
    describeScanError(
      graphQLError('TicketWrongEventError', {
        tokenId: 'ticket',
        productId: 'event',
        expectedProductId: 'gate',
      }),
    ),
    { verdict: 'WRONG_EVENT', productId: 'event' },
  );
  assert.deepEqual(
    describeScanError(
      graphQLError('TicketCanceledError', { scope: 'EVENT', cancelledDate: '2026-09-30T10:00:00.000Z' }),
    ),
    { verdict: 'CANCELLED', scope: 'EVENT', date: '2026-09-30T10:00:00.000Z' },
  );
  assert.deepEqual(
    describeScanError(
      graphQLError('TicketAlreadyRedeemedError', { invalidatedDate: '2026-10-01T18:05:00.000Z' }),
    ),
    { verdict: 'ALREADY_REDEEMED', date: '2026-10-01T18:05:00.000Z' },
  );
  assert.deepEqual(
    describeScanError(
      graphQLError('TicketNotRedeemableError', {
        reason: 'NOT_YET_OPEN',
        startsAt: '2026-10-01T18:00:00.000Z',
        opensAt: '2026-10-01T16:00:00.000Z',
        closesAt: '2026-10-01T19:00:00.000Z',
      }),
    ),
    {
      verdict: 'NOT_REDEEMABLE',
      reason: 'NOT_YET_OPEN',
      startsAt: '2026-10-01T18:00:00.000Z',
      opensAt: '2026-10-01T16:00:00.000Z',
      closesAt: '2026-10-01T19:00:00.000Z',
    },
  );
  assert.deepEqual(describeScanError(graphQLError('NoPermissionError')), { verdict: 'NO_PERMISSION' });
  assert.deepEqual(describeScanError(graphQLError('TokenNotFoundError')), { verdict: 'NOT_FOUND' });
  assert.deepEqual(describeScanError(graphQLError('InvalidIdError')), { verdict: 'NOT_FOUND' });
  // Apollo Client 3 shape
  assert.deepEqual(
    describeScanError({ graphQLErrors: [{ message: 'x', extensions: { code: 'TokenNotFoundError' } }] }),
    { verdict: 'NOT_FOUND' },
  );
  assert.deepEqual(describeScanError(graphQLError('SomethingElse', {}, 'Boom')), {
    verdict: 'ERROR',
    message: 'Boom',
  });
  assert.deepEqual(describeScanError(new Error('Failed to fetch')), {
    verdict: 'ERROR',
    message: 'Failed to fetch',
  });
  assert.deepEqual(describeScanError(undefined), { verdict: 'ERROR' });
});

test('getScanTone tells good, doubtful and bad scans apart', () => {
  assert.equal(getScanTone({ verdict: 'VALID' }), 'ok');
  assert.equal(getScanTone({ verdict: 'ADMITTED' }), 'ok');
  assert.equal(getScanTone({ verdict: 'ALREADY_REDEEMED' }), 'warn');
  assert.equal(getScanTone({ verdict: 'NOT_REDEEMABLE' }), 'warn');
  for (const verdict of [
    'CANCELLED',
    'WRONG_EVENT',
    'NOT_FOUND',
    'NOT_A_TICKET',
    'NO_PERMISSION',
    'ERROR',
  ] as const) {
    assert.equal(getScanTone({ verdict }), 'error', verdict);
  }
});

test('createRepeatGuard ignores a code held in front of the camera but not the next ticket', () => {
  let now = 0;
  const guard = createRepeatGuard(2000, () => now);
  assert.equal(guard('a'), true);
  now = 500;
  assert.equal(guard('a'), false);
  // Every sighting extends the quiet period while the code stays in view.
  now = 2400;
  assert.equal(guard('a'), false);
  now = 5000;
  assert.equal(guard('a'), true);
  now = 5100;
  assert.equal(guard('b'), true);
  now = 5200;
  assert.equal(guard('a'), true);
  guard.reset();
  assert.equal(guard('a'), true);
});

test('checkTicket admits the tickets of every event of a gate', () => {
  const ticketOf = (productId: string) => ({
    _id: `ticket-of-${productId}`,
    ticketStatus: 'VALID',
    isInvalidateable: true,
    product: { _id: productId, status: 'ACTIVE', isCanceled: false },
  });
  // One performance sold as several products (categories): one gate admits them all.
  const gate = { eventIds: ['adults', 'reduced'] };
  assert.deepEqual(checkTicket(ticketOf('adults'), gate), { verdict: 'VALID' });
  assert.deepEqual(checkTicket(ticketOf('reduced'), gate), { verdict: 'VALID' });
  assert.deepEqual(checkTicket(ticketOf('other-show'), gate), {
    verdict: 'WRONG_EVENT',
    productId: 'other-show',
  });
  // A gate without events admits the tickets of any event.
  assert.deepEqual(checkTicket(ticketOf('other-show'), { eventIds: [] }), { verdict: 'VALID' });
});

const validTicket = (overrides = {}) => ({
  _id: 'ticket',
  tokenSerialNumber: '7',
  ticketStatus: 'VALID',
  isInvalidateable: true,
  product: { _id: 'event', status: 'ACTIVE', isCanceled: false },
  ...overrides,
});

const gateApi = ({
  tickets = [] as any[],
  lookupError = null as unknown,
  redeemError = null as unknown,
  lookup = null as null | ((input: { code: string; productId?: string | null }) => any[]),
} = {}) => {
  const calls = { lookups: [] as unknown[], redeems: [] as unknown[] };
  return {
    calls,
    lookupTickets: async (input: { code: string; productId?: string | null }) => {
      calls.lookups.push(input);
      if (lookupError) throw lookupError;
      return lookup ? lookup(input) : tickets;
    },
    redeemTicket: async (input: { tokenId: string; productId?: string | null }) => {
      calls.redeems.push(input);
      if (redeemError) throw redeemError;
      return { ...tickets[0], ticketStatus: 'REDEEMED', invalidatedDate: '2026-10-01T18:05:00.000Z' };
    },
  };
};

test('checkTicketCode refuses camera codes that hold no ticket without asking the server', async () => {
  const api = gateApi();
  assert.deepEqual(
    await checkTicketCode({ code: 'WIFI:S:guest;;', eventIds: ['event'], fromCamera: true }, api),
    { code: 'WIFI:S:guest;;', check: { verdict: 'NOT_A_TICKET' } },
  );
  assert.equal(api.calls.lookups.length, 0);
  // Typed codes may be names, the server decides.
  await checkTicketCode({ code: 'Anna Muster', eventIds: ['event'] }, api);
  assert.deepEqual(api.calls.lookups, [{ code: 'Anna Muster', productId: 'event' }]);
});

test('checkTicketCode only takes ticket QR codes from the camera: a ticket id with its access key', async () => {
  // Serials are printed on every ticket and run from 1, names and order numbers are no secret:
  // a QR code holding one of them must not stand in for the ticket.
  const seat12 = validTicket({ _id: 'real-ticket-of-seat-12', tokenSerialNumber: '12' });
  const api = gateApi({ tickets: [seat12] });
  for (const code of ['12', '#12', 'Alice', '10042', 'real-ticket-of-seat-12', 'https://x.test/12']) {
    assert.deepEqual(
      await checkTicketCode({ code, eventIds: ['event'], fromCamera: true, autoRedeem: true }, api),
      { code, check: { verdict: 'NOT_A_TICKET' } },
      code,
    );
  }
  assert.equal(api.calls.lookups.length, 0);
  assert.equal(api.calls.redeems.length, 0);
});

test('checkTicketCode resolves camera codes by ticket id only, never by serial, name or order number', async () => {
  // ticketLookup falls back to serials, names and order numbers when no ticket has the id.
  const seat12 = validTicket({ _id: 'real-ticket-of-seat-12', tokenSerialNumber: '12' });
  for (const code of [
    'unchained-scanner://12?hash=forged',
    'https://x.test/download/Alice?hash=forged',
    'unchained://ticket/10042?hash=forged',
  ]) {
    const api = gateApi({ tickets: [seat12] });
    assert.deepEqual(
      await checkTicketCode({ code, eventIds: ['event'], fromCamera: true, autoRedeem: true }, api),
      { code, check: { verdict: 'NOT_FOUND' } },
      code,
    );
    assert.equal(api.calls.redeems.length, 0, code);
    // Without an event the server searches no serials or names in the first place.
    assert.deepEqual(api.calls.lookups, [{ code, productId: null }], code);
  }
  const several = gateApi({ tickets: [seat12, validTicket({ _id: 'another' })] });
  assert.deepEqual(
    await checkTicketCode(
      { code: 'https://x.test/download/Alice?hash=forged', eventIds: ['event'], fromCamera: true },
      several,
    ),
    { code: 'https://x.test/download/Alice?hash=forged', check: { verdict: 'NOT_FOUND' } },
  );
});

test('checkTicketCode shows a single ticket and redeems it right away only when asked to', async () => {
  const api = gateApi({ tickets: [validTicket()] });
  const shown = await checkTicketCode(
    { code: 'https://x.test/ticket?hash=k', eventIds: ['event'], fromCamera: true },
    api,
  );
  assert.deepEqual(shown.check, { verdict: 'VALID' });
  assert.equal(shown.ticket?._id, 'ticket');
  assert.equal(shown.matchedBy, 'QR_CODE');
  // The code's access key is kept, so a later manual redeem lets the server check it.
  assert.equal(shown.accessKey, 'k');
  assert.equal(api.calls.redeems.length, 0);

  const admitted = await checkTicketCode(
    { code: 'https://x.test/ticket?hash=k', eventIds: ['event'], fromCamera: true, autoRedeem: true },
    api,
  );
  assert.deepEqual(admitted.check, { verdict: 'ADMITTED' });
  assert.equal(admitted.ticket?.ticketStatus, 'REDEEMED');
  assert.deepEqual(api.calls.redeems, [{ tokenId: 'ticket', productId: 'event', accessKey: 'k' }]);

  // A ticket that cannot be redeemed is shown, never sent to scanTicket.
  const cancelled = gateApi({ tickets: [validTicket({ ticketStatus: 'CANCELLED' })] });
  const refused = await checkTicketCode(
    { code: 'https://x.test/ticket?hash=k', eventIds: ['event'], autoRedeem: true },
    cancelled,
  );
  assert.deepEqual(refused.check, { verdict: 'CANCELLED', scope: 'TICKET' });
  assert.equal(cancelled.calls.redeems.length, 0);
});

test('checkTicketCode never redeems typed serials, names, order numbers or ids right away', async () => {
  for (const code of ['#7', 'Anna', '10042', 'ticket']) {
    const api = gateApi({ tickets: [validTicket()] });
    const result = await checkTicketCode({ code, eventIds: ['event'], autoRedeem: true }, api);
    assert.deepEqual(result.check, { verdict: 'VALID' }, code);
    // The gate asks staff to check the ticket before they redeem it by hand.
    assert.equal(result.matchedBy, 'SEARCH', code);
    assert.equal(api.calls.redeems.length, 0, code);
  }
  // Barcode readers type the whole QR code into the field: that is a ticket QR code.
  const api = gateApi({ tickets: [validTicket()] });
  const admitted = await checkTicketCode(
    { code: 'unchained-scanner://ticket?hash=k', eventIds: ['event'], autoRedeem: true },
    api,
  );
  assert.deepEqual(admitted.check, { verdict: 'ADMITTED' });
  assert.equal(admitted.matchedBy, 'QR_CODE');
  // A typed QR code whose id matches no ticket falls back to a search result.
  const serial = gateApi({ tickets: [validTicket({ _id: 'real-ticket-of-seat-12' })] });
  const searched = await checkTicketCode(
    { code: 'unchained-scanner://12?hash=forged', eventIds: ['event'], autoRedeem: true },
    serial,
  );
  assert.equal(searched.matchedBy, 'SEARCH');
  assert.equal(serial.calls.redeems.length, 0);
});

test('checkTicketCode lists several matches with the tickets of the gate event first', async () => {
  const other = validTicket({ _id: 'other', product: { _id: 'other-event', status: 'ACTIVE' } });
  const own = validTicket({ _id: 'own' });
  const api = gateApi({ tickets: [other, own] });
  const result = await checkTicketCode({ code: '10042', eventIds: ['event'], autoRedeem: true }, api);
  assert.deepEqual(
    result.candidates?.map(({ _id }) => _id),
    ['own', 'other'],
  );
  assert.equal(result.check, undefined);
  assert.equal(api.calls.redeems.length, 0);
});

test('checkTicketCode searches typed codes in every event of the gate', async () => {
  const adults = validTicket({ _id: 'adults-7', product: { _id: 'adults', status: 'ACTIVE' } });
  const reduced = validTicket({ _id: 'reduced-7', product: { _id: 'reduced', status: 'ACTIVE' } });
  const byEvent = { adults: [adults], reduced: [reduced] };
  const api = gateApi({ lookup: ({ productId }) => byEvent[productId] || [] });
  const result = await checkTicketCode({ code: '#7', eventIds: ['adults', 'reduced'] }, api);
  assert.deepEqual(api.calls.lookups, [
    { code: '#7', productId: 'adults' },
    { code: '#7', productId: 'reduced' },
  ]);
  assert.deepEqual(
    result.candidates?.map(({ _id }) => _id),
    ['adults-7', 'reduced-7'],
  );

  // Ids and order numbers match the same ticket in every event's lookup: it is shown once.
  const same = gateApi({ tickets: [adults] });
  const single = await checkTicketCode({ code: 'adults-7', eventIds: ['adults', 'reduced'] }, same);
  assert.equal(single.ticket?._id, 'adults-7');
  assert.deepEqual(single.check, { verdict: 'VALID' });

  // A gate for any event searches ids and order numbers without an event.
  const any = gateApi({ tickets: [adults] });
  await checkTicketCode({ code: '10042', eventIds: [] }, any);
  assert.deepEqual(any.calls.lookups, [{ code: '10042', productId: null }]);
});

test('checkTicketCode explains unknown codes and failed lookups', async () => {
  assert.deepEqual(await checkTicketCode({ code: ' 404 ', eventIds: ['event'] }, gateApi()), {
    code: '404',
    check: { verdict: 'NOT_FOUND' },
  });
  assert.deepEqual(
    await checkTicketCode(
      { code: 'x', eventIds: ['event'] },
      gateApi({ lookupError: graphQLError('NoPermissionError') }),
    ),
    { code: 'x', check: { verdict: 'NO_PERMISSION' } },
  );
  assert.deepEqual(await checkTicketCode({ code: '   ', eventIds: ['event'] }, gateApi()), null);
});

test('redeemGateTicket admits through scanTicket or tells why the gate refused', async () => {
  const ticket = validTicket();
  const api = gateApi({ tickets: [ticket] });
  const admitted = await redeemGateTicket(ticket, { eventIds: ['event'] }, api);
  assert.deepEqual(admitted.check, { verdict: 'ADMITTED' });
  assert.equal(admitted.ticket?.invalidatedDate, '2026-10-01T18:05:00.000Z');

  const raced = gateApi({
    tickets: [ticket],
    redeemError: graphQLError('TicketAlreadyRedeemedError', {
      invalidatedDate: '2026-10-01T18:04:00.000Z',
    }),
  });
  assert.deepEqual(await redeemGateTicket(ticket, { eventIds: ['event'] }, raced), {
    code: 'ticket',
    ticket,
    check: { verdict: 'ALREADY_REDEEMED', date: '2026-10-01T18:04:00.000Z' },
  });
});

test('redeemGateTicket tells scanTicket which of the gate events the ticket is for', async () => {
  const ticketOf = (productId: string) => validTicket({ product: { _id: productId, status: 'ACTIVE' } });
  const redeemedWith = async (ticket, eventIds: string[]) => {
    const api = gateApi({ tickets: [ticket] });
    await redeemGateTicket(ticket, { eventIds }, api);
    return api.calls.redeems;
  };
  assert.deepEqual(await redeemedWith(ticketOf('reduced'), ['adults', 'reduced']), [
    { tokenId: 'ticket', productId: 'reduced' },
  ]);
  // Outside the gate's events scanTicket gets the gate's event and refuses the ticket.
  assert.deepEqual(await redeemedWith(ticketOf('other-show'), ['adults', 'reduced']), [
    { tokenId: 'ticket', productId: 'adults' },
  ]);
  assert.deepEqual(await redeemedWith(validTicket({ product: null }), ['adults', 'reduced']), [
    { tokenId: 'ticket', productId: 'adults' },
  ]);
  assert.deepEqual(await redeemedWith(ticketOf('other-show'), []), [
    { tokenId: 'ticket', productId: 'other-show' },
  ]);
});

test('redeemGateTicket sends the access key of a scanned QR code, so outdated codes are refused', async () => {
  const ticket = validTicket();
  const api = gateApi({ tickets: [ticket] });
  await redeemGateTicket(ticket, { eventIds: ['event'] }, api, { accessKey: 'k' });
  assert.deepEqual(api.calls.redeems, [{ tokenId: 'ticket', productId: 'event', accessKey: 'k' }]);

  const outdated = gateApi({
    tickets: [ticket],
    redeemError: graphQLError('TicketAccessKeyInvalidError', { tokenId: 'ticket' }),
  });
  assert.deepEqual(
    await redeemGateTicket(ticket, { eventIds: ['event'] }, outdated, { accessKey: 'old' }),
    {
      code: 'ticket',
      ticket,
      check: { verdict: 'INVALID_CODE' },
    },
  );
  assert.equal(getScanTone({ verdict: 'INVALID_CODE' }), 'error');

  // Typed searches carry no key.
  const typed = await checkTicketCode(
    { code: '#7', eventIds: ['event'] },
    gateApi({ tickets: [ticket] }),
  );
  assert.equal(typed.accessKey, undefined);
});
