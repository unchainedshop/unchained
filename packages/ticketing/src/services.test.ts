import { test } from 'node:test';
import assert from 'node:assert/strict';
import services from './services.ts';
import { getEmitAdapter, setEmitAdapter } from '@unchainedshop/events';
import { TicketingEventTypes } from './events.ts';

test('cancels tickets and marks the product cancelled through the product module API', async () => {
  const invalidated: string[] = [];
  const cancelled: string[] = [];
  const product = { meta: { cancelled: false } };
  const modules = {
    warehousing: {
      findTokens: async () => [{ _id: 'first' }, { _id: 'second' }],
      invalidateToken: async (id: string) => invalidated.push(id),
    },
    passes: { cancelTicket: async (id: string) => cancelled.push(id) },
    products: {
      update: async (id: string, fields: Record<string, unknown>) => {
        assert.equal(id, 'product');
        assert.ok(!('$set' in fields), 'products.update accepts fields, not MongoDB operators');
        product.meta.cancelled = fields['meta.cancelled'] as boolean;
      },
    },
  };
  const { cancelledCount } = await services.ticketing.cancelTicketsForProduct.call(
    modules as any,
    'product',
  );
  assert.equal(cancelledCount, 2);
  assert.deepEqual(invalidated, ['first', 'second']);
  assert.deepEqual(cancelled, ['first', 'second']);
  assert.equal(product.meta.cancelled, true);
});

test('both cancellation paths reimburse ticket units and validate issuance before mutation', async () => {
  for (const kind of ['event', 'ticket']) {
    const issued: any[] = [];
    let cancelled = false;
    let failIssuance = false;
    const token = { _id: 'token', productId: 'event', userId: 'buyer', quantity: 3 };
    const modules = {
      warehousing: {
        findTokens: async () => [token],
        findToken: async () => token,
        invalidateToken: async () => {
          cancelled = true;
        },
      },
      passes: {
        cancelTicket: async () => token,
        generateDiscountCode: async (amount: number, currency: string) => {
          if (failIssuance) throw new Error('issuance failed');
          issued.push([amount, currency]);
          return 'code';
        },
      },
      products: {
        update: async () => undefined,
        findProduct: async () => ({ _id: 'event' }),
        prices: { price: async () => ({ amount: 1999, currencyCode: 'CHF' }) },
      },
      worker: { addWork: async () => undefined },
    };
    const service =
      kind === 'event'
        ? services.ticketing.cancelTicketsForProduct
        : services.ticketing.cancelTicketWithDiscount;
    await service.call(modules as any, kind, {
      generateDiscount: true,
      countryCode: 'CH',
      currencyCode: 'CHF',
    });
    assert.deepEqual(issued, [[5997, 'CHF']]);
    assert.equal(cancelled, true);
    cancelled = false;
    failIssuance = true;
    await assert.rejects(
      service.call(modules as any, kind, {
        generateDiscount: true,
        countryCode: 'CH',
        currencyCode: 'CHF',
      }),
      /issuance failed/,
    );
    assert.equal(cancelled, false);
  }
});

// Records emitted events; the emitter is process-wide, so the previous one is restored.
async function recordEvents(run: () => Promise<void>) {
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
  return events.filter(({ name }) => (Object.values(TicketingEventTypes) as string[]).includes(name));
}

function createTicketModules(tokens: any[]) {
  const calls: string[] = [];
  const productUpdates: Record<string, unknown>[] = [];
  const messages: any[] = [];
  const stored = new Map(tokens.map((token) => [token._id, structuredClone(token)]));
  const modules = {
    warehousing: {
      findTokens: async () => [...stored.values()].filter((token) => !token.meta?.cancelled),
      findToken: async ({ tokenId }) => structuredClone(stored.get(tokenId)),
      invalidateToken: async (tokenId: string) => {
        calls.push(`invalidate:${tokenId}`);
        const token = stored.get(tokenId);
        if (!token || token.invalidatedDate) return null;
        token.invalidatedDate = new Date();
        return structuredClone(token);
      },
    },
    passes: {
      cancelTicket: async (tokenId: string, { onlyValid }: { onlyValid?: boolean } = {}) => {
        calls.push(`cancel:${tokenId}`);
        const token = stored.get(tokenId);
        if (!token || (onlyValid && (token.invalidatedDate || token.meta?.cancelled))) return null;
        token.meta = { ...token.meta, cancelled: true, cancelledDate: new Date() };
        return structuredClone(token);
      },
      // Runs between reading and cancelling the ticket; tests replace it to land a concurrent write.
      generateDiscountCode: async () => 'code',
    },
    products: {
      findProduct: async () => ({ _id: 'event' }),
      prices: { price: async () => ({ amount: 1000, currencyCode: 'CHF' }) },
      update: async (_id: string, fields: Record<string, unknown>) => {
        productUpdates.push(fields);
      },
    },
    worker: {
      addWork: async ({ input }) => {
        messages.push(input);
      },
    },
  };
  return { modules, calls, productUpdates, messages, stored };
}

test('cancelling an event marks every ticket cancelled before invalidating it and emits ticketing events', async () => {
  const redeemedAt = new Date('2026-09-01T18:00:00.000Z');
  const { modules, calls, productUpdates } = createTicketModules([
    { _id: 'valid', productId: 'event', quantity: 1, meta: {} },
    { _id: 'redeemed', productId: 'event', quantity: 1, meta: {}, invalidatedDate: redeemedAt },
  ]);
  let result: any;
  const events = await recordEvents(async () => {
    result = await services.ticketing.cancelTicketsForProduct.call(modules as any, 'event');
  });
  assert.deepEqual(result, { cancelledCount: 2 });
  assert.deepEqual(calls, [
    'cancel:valid',
    'invalidate:valid',
    'cancel:redeemed',
    'invalidate:redeemed',
  ]);
  assert.equal(productUpdates.length, 1);
  assert.equal(productUpdates[0]['meta.cancelled'], true);
  assert.ok(productUpdates[0]['meta.cancelledDate'] instanceof Date);

  assert.deepEqual(
    events.map(({ name }) => name),
    [
      TicketingEventTypes.TICKET_CANCELLED,
      TicketingEventTypes.TICKET_CANCELLED,
      TicketingEventTypes.TICKET_EVENT_CANCELLED,
    ],
  );
  const [valid, redeemed, eventCancelled] = events.map(({ payload }) => payload);
  assert.equal(valid.token._id, 'valid');
  assert.equal(valid.token.meta.cancelled, true);
  assert.ok(valid.token.invalidatedDate instanceof Date);
  // The redemption date of a ticket redeemed before the cancellation is kept.
  assert.equal(redeemed.token._id, 'redeemed');
  assert.equal(redeemed.token.meta.cancelled, true);
  assert.deepEqual(redeemed.token.invalidatedDate, redeemedAt);
  assert.deepEqual(eventCancelled, { productId: 'event', cancelledCount: 2 });
});

test('cancelling a single ticket cancels before invalidating and returns the cancelled ticket', async () => {
  const { modules, calls } = createTicketModules([
    { _id: 'ticket', productId: 'event', userId: 'buyer', quantity: 1, meta: { orderId: 'order' } },
  ]);
  let result: any;
  const events = await recordEvents(async () => {
    result = await services.ticketing.cancelTicketWithDiscount.call(modules as any, 'ticket');
  });
  assert.deepEqual(calls, ['cancel:ticket', 'invalidate:ticket']);
  assert.equal(result.token.meta.cancelled, true);
  assert.equal(result.token.meta.orderId, 'order');
  assert.ok(result.token.invalidatedDate instanceof Date);
  assert.deepEqual(
    events.map(({ name, payload }) => [name, payload.token._id]),
    [[TicketingEventTypes.TICKET_CANCELLED, 'ticket']],
  );

  // Cancelling again changes nothing and emits nothing.
  calls.length = 0;
  const repeated = await recordEvents(async () => {
    await services.ticketing.cancelTicketWithDiscount.call(modules as any, 'ticket');
  });
  assert.deepEqual(calls, []);
  assert.deepEqual(repeated, []);
});

test('a cancellation that refuses redeemed tickets loses against a scan that lands first', async () => {
  const { modules, calls, messages, stored } = createTicketModules([
    { _id: 'ticket', productId: 'event', userId: 'buyer', quantity: 1, meta: {} },
  ]);
  const discount = { generateDiscount: true, countryCode: 'CH', currencyCode: 'CHF' };
  // The gate redeems the ticket after the cancellation has read it as valid.
  modules.passes.generateDiscountCode = async () => {
    stored.get('ticket').invalidatedDate = new Date();
    return 'code';
  };
  const events = await recordEvents(() =>
    assert.rejects(
      services.ticketing.cancelTicketWithDiscount.call(modules as any, 'ticket', {
        ...discount,
        refuseRedeemed: true,
      }),
      (error: any) => error.cause === 'TICKET_ALREADY_REDEEMED',
    ),
  );
  assert.deepEqual(calls, ['cancel:ticket']);
  assert.equal(stored.get('ticket').meta.cancelled, undefined);
  assert.deepEqual(events, [], 'no TICKET_CANCELLED');
  assert.deepEqual(messages, [], 'no cancellation e-mail and no reimbursement code');

  // A ticket that was already redeemed when it was read is refused before any credit is issued.
  let issued = 0;
  modules.passes.generateDiscountCode = async () => {
    issued += 1;
    return 'code';
  };
  calls.length = 0;
  await assert.rejects(
    services.ticketing.cancelTicketWithDiscount.call(modules as any, 'ticket', {
      ...discount,
      refuseRedeemed: true,
    }),
    (error: any) => error.cause === 'TICKET_ALREADY_REDEEMED',
  );
  assert.equal(issued, 0);
  assert.deepEqual(calls, []);

  // Without refuseRedeemed the service still cancels a redeemed ticket and keeps its date.
  const redeemedAt = stored.get('ticket').invalidatedDate;
  const { token } = await services.ticketing.cancelTicketWithDiscount.call(modules as any, 'ticket');
  assert.equal(token.meta.cancelled, true);
  assert.deepEqual(token.invalidatedDate, redeemedAt);
});

test('a cancellation that refuses redeemed tickets leaves a ticket cancelled concurrently to the other one', async () => {
  const { modules, messages, stored } = createTicketModules([
    { _id: 'ticket', productId: 'event', userId: 'buyer', quantity: 1, meta: {} },
  ]);
  // Another cancellation completes after this one has read the ticket as valid.
  modules.passes.generateDiscountCode = async () => {
    const token = stored.get('ticket');
    token.meta = { cancelled: true, cancelledDate: new Date() };
    token.invalidatedDate = new Date();
    return 'code';
  };
  let result: any;
  const events = await recordEvents(async () => {
    result = await services.ticketing.cancelTicketWithDiscount.call(modules as any, 'ticket', {
      generateDiscount: true,
      countryCode: 'CH',
      refuseRedeemed: true,
    });
  });
  assert.equal(result.token.meta.cancelled, true);
  assert.deepEqual(events, []);
  assert.deepEqual(messages, []);
});

test('an event without tickets is still marked cancelled and reported', async () => {
  const { modules, productUpdates } = createTicketModules([]);
  const events = await recordEvents(async () => {
    await services.ticketing.cancelTicketsForProduct.call(modules as any, 'event');
  });
  assert.equal(productUpdates[0]['meta.cancelled'], true);
  assert.deepEqual(
    events.map(({ name, payload }) => [name, payload]),
    [[TicketingEventTypes.TICKET_EVENT_CANCELLED, { productId: 'event', cancelledCount: 0 }]],
  );
});
