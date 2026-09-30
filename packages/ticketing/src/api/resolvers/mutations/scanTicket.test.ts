import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEmitAdapter, setEmitAdapter } from '@unchainedshop/events';
import scanTicket from './scanTicket.ts';

const token = { _id: 'ticket', productId: 'event' };
const product = { _id: 'event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' };

function createContext(data: {
  token?: any;
  product?: any;
  eligible?: boolean;
  providers?: any[];
  invalidateToken?: () => Promise<any>;
  findToken?: () => Promise<any>;
}) {
  return {
    userId: 'scanner',
    modules: {
      products: { findProduct: async () => data.product },
      warehousing: {
        findToken: data.findToken || (async () => data.token),
        invalidateToken: data.invalidateToken,
        allProviders: async () => data.providers || [],
        buildAccessKeyFromToken: async (t: any) => `key-${t._id}-${t.userId ?? ''}`,
      },
    },
    services: { warehousing: { isTokenInvalidateable: async () => data.eligible } },
  } as any;
}

// Records the ticketing events; the emitter is process-wide, so the previous one is restored.
async function recordEvents(run: () => Promise<unknown>) {
  const events: { name: string; payload: any }[] = [];
  const previous = getEmitAdapter();
  setEmitAdapter({
    publish: (name, { payload }) => {
      events.push({ name, payload });
    },
    subscribe: () => undefined,
  });
  try {
    await run();
  } finally {
    setEmitAdapter(previous);
  }
  return events.filter(({ name }) => name.startsWith('TICKET_'));
}

const HOUR = 3_600_000;

test('scanning explains why a ticket cannot be redeemed, checking cancellation before redemption', async () => {
  const cancelledDate = new Date('2026-09-01T10:00:00Z');
  const invalidatedDate = new Date('2026-09-01T09:00:00Z');
  for (const [scenario, code, extensions] of [
    [{ tokenId: '' }, 'InvalidIdError', {}],
    [{ token: null }, 'TokenNotFoundError', { tokenId: 'ticket' }],
    [
      { productId: 'other-event' },
      'TicketWrongEventError',
      { tokenId: 'ticket', productId: 'event', expectedProductId: 'other-event' },
    ],
    // A wrong event wins over every other status: the ticket is not for this gate at all.
    [
      { productId: 'other-event', token: { ...token, meta: { cancelled: true } } },
      'TicketWrongEventError',
      {},
    ],
    [
      { token: { ...token, meta: { cancelled: true, cancelledDate }, invalidatedDate } },
      'TicketCanceledError',
      { tokenId: 'ticket', productId: 'event', scope: 'TICKET', cancelledDate },
    ],
    [
      { product: { ...product, meta: { cancelled: true } }, token: { ...token, invalidatedDate } },
      'TicketCanceledError',
      { scope: 'EVENT' },
    ],
    [
      { token: { ...token, invalidatedDate } },
      'TicketAlreadyRedeemedError',
      { tokenId: 'ticket', productId: 'event', invalidatedDate },
    ],
    [{ product: null }, 'TicketNotRedeemableError', { reason: 'EVENT_INACTIVE' }],
    [
      { product: { ...product, type: 'SIMPLE_PRODUCT' } },
      'TicketNotRedeemableError',
      { reason: 'EVENT_INACTIVE' },
    ],
    [
      { product: { ...product, status: 'DRAFT' } },
      'TicketNotRedeemableError',
      { reason: 'EVENT_INACTIVE' },
    ],
    [{ eligible: false }, 'TicketNotRedeemableError', { reason: 'NOT_REDEEMABLE' }],
  ] as const) {
    let invalidations = 0;
    const data: any = { token, product, tokenId: 'ticket', eligible: true, ...scenario };
    const context = createContext({
      ...data,
      invalidateToken: async () => {
        invalidations += 1;
      },
    });
    const events = await recordEvents(() =>
      assert.rejects(
        scanTicket(undefined as never, { tokenId: data.tokenId, productId: data.productId }, context),
        (error: any) => {
          assert.equal(error.extensions?.code, code, JSON.stringify(scenario));
          for (const [key, value] of Object.entries(extensions)) {
            assert.deepEqual(error.extensions[key], value, `${code} ${key}`);
          }
          return true;
        },
      ),
    );
    assert.equal(invalidations, 0);
    assert.deepEqual(events, []);
  }
});

test('outside the entry window the reason says whether the entrance is not open yet or closed', async () => {
  const startsAt = new Date(Date.now() + 5 * HOUR);
  const event = { ...product, meta: { slot: startsAt } };
  const issuer = {
    type: 'VIRTUAL',
    adapterKey: 'shop.unchained.warehousing.ticket',
    configuration: [
      { key: 'entryOpensMinutesBefore', value: '120' },
      { key: 'entryClosesMinutesAfter', value: '60' },
    ],
  };
  const reasonFor = async (eventProduct: any, providers: any[]) => {
    const context = createContext({ token, product: eventProduct, eligible: false, providers });
    try {
      await scanTicket(undefined as never, { tokenId: 'ticket' }, context);
    } catch (error: any) {
      assert.equal(error.extensions.code, 'TicketNotRedeemableError');
      return error.extensions;
    }
    throw new Error('scanTicket did not fail');
  };

  const early = await reasonFor(event, [issuer]);
  assert.equal(early.reason, 'NOT_YET_OPEN');
  assert.deepEqual(early.startsAt, startsAt);
  assert.deepEqual(early.opensAt, new Date(startsAt.getTime() - 2 * HOUR));
  assert.deepEqual(early.closesAt, new Date(startsAt.getTime() + HOUR));

  const past = {
    ...product,
    meta: { slot: new Date(Date.now() - 5 * HOUR).toISOString() },
  };
  assert.equal((await reasonFor(past, [issuer])).reason, 'ENTRY_CLOSED');

  // Without the ticket issuer the refusal comes from another adapter, so no window is claimed.
  const unknown = await reasonFor(event, []);
  assert.equal(unknown.reason, 'NOT_REDEEMABLE');
  assert.equal(unknown.opensAt, undefined);
});

test('a valid ticket is redeemed once and announced as TICKET_REDEEMED', async () => {
  const redeemed = { ...token, invalidatedDate: new Date() };
  let invalidations = 0;
  const context = createContext({
    token,
    product,
    eligible: true,
    invalidateToken: async () => {
      invalidations += 1;
      return redeemed;
    },
  });
  let result: any;
  const events = await recordEvents(async () => {
    result = await scanTicket(undefined as never, { tokenId: 'ticket', productId: 'event' }, context);
  });
  assert.equal(result, redeemed);
  assert.equal(invalidations, 1);
  assert.deepEqual(events, [
    { name: 'TICKET_REDEEMED', payload: { token: redeemed, redeemedBy: 'scanner' } },
  ]);
});

test('a ticket redeemed concurrently at another gate is reported as already redeemed', async () => {
  const invalidatedDate = new Date();
  let reads = 0;
  const context = createContext({
    product,
    eligible: true,
    invalidateToken: async () => null,
    // The first read sees a valid ticket, the re-read after the lost race the redemption.
    findToken: async () => {
      reads += 1;
      return reads === 1 ? token : { ...token, invalidatedDate };
    },
  });
  await assert.rejects(scanTicket(undefined as never, { tokenId: token._id }, context), (error: any) => {
    assert.equal(error.extensions.code, 'TicketAlreadyRedeemedError');
    assert.deepEqual(error.extensions.invalidatedDate, invalidatedDate);
    return true;
  });
});

test('a ticket cancelled while it is being scanned is refused, not admitted', async () => {
  const cancelledDate = new Date();
  // The scan read a valid ticket; the cancellation was written before the redemption, which
  // still matched because the ticket had not been invalidated yet.
  const context = createContext({
    token,
    product,
    eligible: true,
    invalidateToken: async () => ({
      ...token,
      invalidatedDate: new Date(),
      meta: { cancelled: true, cancelledDate },
    }),
  });
  const events = await recordEvents(() =>
    assert.rejects(scanTicket(undefined as never, { tokenId: token._id }, context), (error: any) => {
      assert.equal(error.extensions.code, 'TicketCanceledError');
      assert.equal(error.extensions.scope, 'TICKET');
      assert.deepEqual(error.extensions.cancelledDate, cancelledDate);
      return true;
    }),
  );
  assert.deepEqual(events, []);
});

test('a scanned access key must match the ticket, so outdated and forged QR codes are refused', async () => {
  const redeemed = { ...token, invalidatedDate: new Date() };
  const holder = { ...token, userId: 'new-holder' };
  const scanWith = async (accessKey?: string | null) => {
    let invalidations = 0;
    const context = createContext({
      token: holder,
      product,
      eligible: true,
      invalidateToken: async () => {
        invalidations += 1;
        return redeemed;
      },
    });
    const result = await scanTicket(undefined as never, { tokenId: 'ticket', accessKey }, context).then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    return { ...result, invalidations };
  };

  // The code of the current holder redeems the ticket.
  const current = await scanWith('key-ticket-new-holder');
  assert.equal(current.value, redeemed);
  assert.equal(current.invalidations, 1);

  // A code issued to the previous holder (or a forged one) is refused before anything is written.
  for (const accessKey of ['key-ticket-previous-holder', '', 'forged']) {
    const refused = await scanWith(accessKey);
    assert.equal((refused as any).error?.extensions?.code, 'TicketAccessKeyInvalidError', accessKey);
    assert.equal(refused.invalidations, 0);
  }

  // Typed codes carry no key: staff decide, the check is skipped.
  for (const accessKey of [undefined, null]) {
    const typed = await scanWith(accessKey);
    assert.equal(typed.value, redeemed);
  }
});
