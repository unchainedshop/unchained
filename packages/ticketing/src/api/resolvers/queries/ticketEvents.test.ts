import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { buildFindSelector } from '@unchainedshop/core-products';
import ticketEvents, { buildTicketEventQuery } from './ticketEvents.ts';
import ticketEventsCount from './ticketEventsCount.ts';

test('scanner lists and counts filter drafts, search and validity before pagination', async () => {
  const products = [
    { _id: 'expired', active: true, title: 'Event' },
    { _id: 'first', active: true, title: 'Event' },
    { _id: 'second', active: true, title: 'Event' },
    { _id: 'draft', active: false, title: 'Event' },
  ];
  const select = ({ includeDrafts, queryString }: any) =>
    products.filter(
      (p) => (includeDrafts || p.active) && (!queryString || p.title.includes(queryString)),
    );
  const tokenSelectors: any[] = [];
  const context = {
    userId: 'scanner',
    user: { _id: 'scanner' },
    roles: { userHasPermission: async (_context: any, action: string) => action === 'scanTicket' },
    services: {
      warehousing: {
        isTokenInvalidateable: async ({ token }: any) => token.productId !== 'expired',
      },
    },
    modules: {
      products: {
        findProducts: async (query: any) =>
          select(query).slice(
            query.offset || 0,
            query.limit ? (query.offset || 0) + query.limit : undefined,
          ),
        count: async (query: any) => select(query).length,
      },
      warehousing: {
        findTokens: async (selector: any) => {
          tokenSelectors.push(selector);
          return [{ productId: selector.productId }];
        },
      },
    },
  } as any;
  for (const [offset, expected] of [
    [0, ['first']],
    [1, ['second']],
    [2, []],
  ] as const) {
    const result = await ticketEvents(
      undefined as never,
      { limit: 1, offset, onlyInvalidateable: true },
      context,
    );
    assert.deepEqual(
      result.map((p: any) => p._id),
      expected,
    );
  }
  // Redeemed and cancelled tickets are excluded before any adapter is consulted.
  assert.ok(tokenSelectors.length);
  for (const selector of tokenSelectors) {
    assert.equal(selector.invalidatedDate, null);
    assert.equal(selector['meta.cancelled'], null);
  }
  assert.equal(await ticketEventsCount(undefined as never, { onlyInvalidateable: true }, context), 2);
  assert.equal(await ticketEventsCount(undefined as never, {}, context), 3);
  assert.equal(await ticketEventsCount(undefined as never, { queryString: 'missing' }, context), 0);
  const manager = { ...context, roles: { userHasPermission: async () => true } };
  assert.equal(await ticketEventsCount(undefined as never, {}, manager), 4);
  assert.equal(await ticketEventsCount(undefined as never, { includeDrafts: false }, manager), 3);
});

test('the slot range matches starts stored as Date or ISO string, falls back to the meta slot and combines with tags', async () => {
  const server = await MongoMemoryServer.create();
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    const Products = client.db('ticket-events-slot').collection<any>('products');
    const event = (_id: string, fields: Record<string, unknown> = {}) => ({
      _id,
      type: 'TOKENIZED_PRODUCT',
      status: 'ACTIVE',
      ...fields,
    });
    const withSlot = (slot: unknown) => ({ meta: { slot } });
    await Products.insertMany([
      event('date', { ...withSlot(new Date('2026-10-01T19:00:00Z')), tags: ['organizer:a'] }),
      event('iso-string', { ...withSlot('2026-10-01T20:00:00.000Z'), tags: ['organizer:b'] }),
      event('early', withSlot(new Date('2026-10-01T18:00:00Z'))),
      // A slot in the public tokenization properties is not the event start.
      event('moved', {
        ...withSlot(new Date('2026-12-01T19:00:00Z')),
        tokenization: { ercMetadataProperties: { slot: '2026-10-01T19:00:00.000Z' } },
      }),
      event('next-day', withSlot(new Date('2026-10-02T19:00:00Z'))),
      event('dateless'),
      event('cancelled', { meta: { slot: new Date('2026-10-01T19:30:00Z'), cancelled: true } }),
      event('draft', { ...withSlot(new Date('2026-10-01T19:00:00Z')), status: null }),
      {
        _id: 'simple',
        type: 'SIMPLE_PRODUCT',
        status: 'ACTIVE',
        ...withSlot(new Date('2026-10-01T19:00:00Z')),
      },
    ]);
    const scanner = {
      userId: 'scanner',
      user: { _id: 'scanner' },
      roles: { userHasPermission: async (_context: any, action: string) => action === 'scanTicket' },
    } as any;
    const find = async (params: any) => {
      const query = await buildTicketEventQuery(params, scanner);
      const products = await Products.find(buildFindSelector(query as any)).toArray();
      return products.map(({ _id }) => _id).toSorted();
    };
    const october1 = {
      slotFrom: new Date('2026-10-01T00:00:00Z'),
      slotTo: new Date('2026-10-01T23:59:59Z'),
    };

    assert.deepEqual(await find(october1), ['cancelled', 'date', 'early', 'iso-string']);
    assert.deepEqual(await find({ ...october1, onlyInvalidateable: true }), [
      'date',
      'early',
      'iso-string',
    ]);
    assert.deepEqual(await find({ ...october1, tags: ['organizer:a'] }), ['date']);
    // A text search next to the range is accepted by the server ($text stays outside the $or).
    await Products.createIndex({ 'warehousing.sku': 'text', slugs: 'text' });
    await Products.updateOne({ _id: 'iso-string' }, { $set: { slugs: ['concert'] } });
    assert.deepEqual(await find({ ...october1, onlyInvalidateable: true, queryString: 'concert' }), [
      'iso-string',
    ]);
    assert.deepEqual(await find({ slotFrom: new Date('2026-10-01T19:30:00Z') }), [
      'cancelled',
      'iso-string',
      'moved',
      'next-day',
    ]);
    assert.deepEqual(await find({ slotTo: new Date('2026-10-01T18:00:00Z') }), ['early']);
    // Without a range the events without a start stay listed.
    assert.ok((await find({})).includes('dateless'));
  } finally {
    await client.close();
    await server.stop();
  }
});

test('onlyInvalidateable stops scanning events and tickets once the requested page is filled', async () => {
  const products = Array.from({ length: 120 }, (_, index) => ({ _id: `event-${index}` }));
  const productQueries: any[] = [];
  const tokenQueries: any[] = [];
  const context = {
    userId: 'scanner',
    user: { _id: 'scanner' },
    roles: { userHasPermission: async (_context: any, action: string) => action === 'scanTicket' },
    services: {
      warehousing: {
        // Odd events are over; each event has 45 unredeemed tickets.
        isTokenInvalidateable: async ({ product }: any) => Number(product._id.split('-')[1]) % 2 === 0,
      },
    },
    modules: {
      products: {
        findProducts: async (query: any) => {
          productQueries.push(query);
          return products.slice(query.offset || 0, (query.offset || 0) + query.limit);
        },
      },
      warehousing: {
        findTokens: async (selector: any, options: any) => {
          tokenQueries.push({ selector, options });
          const tickets = Array.from({ length: 45 }, (_, index) => ({
            _id: `${selector.productId}-${index}`,
            productId: selector.productId,
          }));
          return tickets.slice(options.skip || 0, (options.skip || 0) + options.limit);
        },
      },
    },
  } as any;

  const page = await ticketEvents(
    undefined as never,
    {
      limit: 2,
      offset: 1,
      onlyInvalidateable: true,
      sort: [{ key: 'meta.slot', value: 'ASC' }],
    },
    context,
  );
  assert.deepEqual(
    page.map(({ _id }: any) => _id),
    ['event-2', 'event-4'],
  );
  // One batch of events was enough, and the requested order stays first with _id breaking ties.
  assert.equal(productQueries.length, 1);
  assert.deepEqual(productQueries[0].sort, [
    { key: 'meta.slot', value: 'ASC' },
    { key: '_id', value: 'ASC' },
  ]);
  assert.equal(productQueries[0].productSelector['meta.cancelled'].$ne, true);
  // Tickets are fetched page by page: a redeemable event needs one page, an ended one all pages.
  for (const { options } of tokenQueries) assert.ok(options.limit > 0 && options.limit <= 20);
  const pagesOf = (productId: string) =>
    tokenQueries.filter(({ selector }) => selector.productId === productId).length;
  assert.equal(pagesOf('event-0'), 1);
  assert.equal(pagesOf('event-1'), 3);

  assert.equal(await ticketEventsCount(undefined as never, { onlyInvalidateable: true }, context), 60);
});
