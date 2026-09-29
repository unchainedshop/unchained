import { test } from 'node:test';
import assert from 'node:assert/strict';
import ticketEvents from './ticketEvents.ts';
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
