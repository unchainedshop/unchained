import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { UnchainedCore } from '@unchainedshop/core';
import cartLoader from './cartLoader.ts';

interface TestCart {
  _id: string;
  userId: string;
  countryCode: string;
  orderNumber?: string;
  updated: Date;
}

const CARTS: TestCart[] = [
  { _id: 'u1-ch-new', userId: 'u1', countryCode: 'CH', updated: new Date('2026-05-03') },
  { _id: 'u1-ch-old', userId: 'u1', countryCode: 'CH', updated: new Date('2026-05-01') },
  { _id: 'u1-de', userId: 'u1', countryCode: 'DE', updated: new Date('2026-04-01') },
  {
    _id: 'u2-ch-named',
    userId: 'u2',
    countryCode: 'CH',
    orderNumber: 'NAMED',
    updated: new Date('2026-05-02'),
  },
];

// Mirrors modules.orders.findCarts: returns the open carts for the requested
// users, most recently updated first. Records the userIds it was called with.
const createLoader = (carts: TestCart[] = CARTS) => {
  const calls: string[][] = [];
  const unchainedAPI = {
    modules: {
      orders: {
        findCarts: async ({ userIds }: { userIds: string[] }) => {
          calls.push(userIds);
          return carts
            .filter((cart) => userIds.includes(cart.userId))
            .sort((a, b) => b.updated.getTime() - a.updated.getTime());
        },
      },
    },
  } as unknown as UnchainedCore;
  return { loader: cartLoader(unchainedAPI), calls };
};

describe('cartLoader', () => {
  it('returns the most recently updated cart for the {userId, countryCode}', async () => {
    const { loader } = createLoader();
    const cart = await loader.load({ userId: 'u1', countryCode: 'CH' });
    assert.strictEqual(cart?._id, 'u1-ch-new');
  });

  it('scopes the cart to the requested countryCode', async () => {
    const { loader } = createLoader();
    const cart = await loader.load({ userId: 'u1', countryCode: 'DE' });
    assert.strictEqual(cart?._id, 'u1-de');
  });

  it('returns null when the user has no cart in the requested country', async () => {
    const { loader } = createLoader();
    assert.strictEqual(await loader.load({ userId: 'u1', countryCode: 'US' }), null);
  });

  it('returns null when the user has no cart at all', async () => {
    const { loader } = createLoader();
    assert.strictEqual(await loader.load({ userId: 'ghost', countryCode: 'CH' }), null);
  });

  it('matches by orderNumber when provided', async () => {
    const { loader } = createLoader();
    assert.strictEqual(
      (await loader.load({ userId: 'u2', countryCode: 'CH', orderNumber: 'NAMED' }))?._id,
      'u2-ch-named',
    );
    assert.strictEqual(
      await loader.load({ userId: 'u2', countryCode: 'CH', orderNumber: 'MISSING' }),
      null,
    );
  });

  it('ignores orderNumber when not provided (returns most recent cart)', async () => {
    const { loader } = createLoader();
    const cart = await loader.load({ userId: 'u2', countryCode: 'CH' });
    assert.strictEqual(cart?._id, 'u2-ch-named');
  });

  it('batches concurrent loads into a single findCarts call with deduped userIds', async () => {
    const { loader, calls } = createLoader();
    const [a, b, c] = await Promise.all([
      loader.load({ userId: 'u1', countryCode: 'CH' }),
      loader.load({ userId: 'u2', countryCode: 'CH' }),
      loader.load({ userId: 'u1', countryCode: 'CH' }),
    ]);
    assert.strictEqual(calls.length, 1);
    assert.deepStrictEqual([...calls[0]].sort(), ['u1', 'u2']);
    assert.strictEqual(a?._id, 'u1-ch-new');
    assert.strictEqual(b?._id, 'u2-ch-named');
    assert.strictEqual(c?._id, 'u1-ch-new');
  });
});
