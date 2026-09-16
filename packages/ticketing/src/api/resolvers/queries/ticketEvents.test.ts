import { test } from 'node:test';
import assert from 'node:assert/strict';
import ticketEvents from './ticketEvents.ts';
import ticketEventsCount from './ticketEventsCount.ts';

test('gate lists and counts filter scope, search, drafts and validity before pagination', async () => {
  const products = [
    { _id: 'other', active: true, title: 'Event' },
    { _id: 'expired', active: true, title: 'Event' },
    { _id: 'authorized', active: true, title: 'Event' },
    { _id: 'draft', active: false, title: 'Event' },
  ];
  const select = ({ productIds, includeDrafts, queryString }: any) =>
    products.filter(
      (p) =>
        (!productIds || productIds.includes(p._id)) &&
        (includeDrafts || p.active) &&
        (!queryString || p.title.includes(queryString)),
    );
  for (const userId of [undefined, 'customer']) {
    const context = {
      userId,
      getCookie: () => 'pass',
      roles: { userHasPermission: async () => false },
      services: {
        ticketing: { productIdsForPassCode: async () => ['expired', 'authorized', 'draft'] },
        warehousing: { isTokenInvalidateable: async ({ token }: any) => token.productId !== 'expired' },
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
        warehousing: { findTokens: async ({ productId }: any) => [{ productId }] },
      },
    } as any;
    const result = await ticketEvents(
      undefined as never,
      { limit: 1, offset: 0, onlyInvalidateable: true },
      context,
    );
    assert.deepEqual(
      result.map((p: any) => p._id),
      ['authorized'],
    );
    assert.equal(await ticketEventsCount(undefined as never, { onlyInvalidateable: true }, context), 1);
    assert.equal(await ticketEventsCount(undefined as never, {}, context), 2);
    assert.equal(await ticketEventsCount(undefined as never, { queryString: 'missing' }, context), 0);
    assert.deepEqual(
      await ticketEvents(undefined as never, { limit: 1, offset: 1, onlyInvalidateable: true }, context),
      [],
    );
  }
});
