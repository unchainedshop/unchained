import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { Modules } from '../modules.ts';
import { migrateOrderCartsService } from './migrateOrderCart.ts';

const lockedError = () => new Error('Could not acquire lock', { cause: 'LOCKED' });

const modulesFor = (carts: Record<string, { _id: string }>, acquireLock: () => Promise<unknown>) =>
  ({
    orders: {
      cart: async ({ userId }: { userId: string }) => carts[userId],
      acquireLock: mock.fn(acquireLock),
      findOrder: async ({ orderId }: { orderId: string }) => ({ _id: orderId, status: null }),
      isCart: () => true,
      moveCartPositions: mock.fn(async () => {
        throw lockedError();
      }),
      setCartOwner: mock.fn(async () => true),
    },
  }) as unknown as Modules;

const migrate = (modules: Modules, fromUserId: string, toUserId: string) =>
  migrateOrderCartsService.call(modules, { fromUserId, toUserId, shouldMerge: true, countryCode: 'CH' });

describe('migrateOrderCartsService', () => {
  it('leaves the cart of a user logging in as themselves alone', async () => {
    const cart = { _id: 'cart' };
    const modules = modulesFor({ user: cart }, async () => ({ release: mock.fn() }));

    assert.equal(await migrate(modules, 'user', 'user'), cart);
    assert.equal((modules.orders.acquireLock as any).mock.callCount(), 0);
  });

  it('skips the merge into a locked cart', async () => {
    const userCart = { _id: 'user-cart' };
    const modules = modulesFor({ guest: { _id: 'guest-cart' }, user: userCart }, async () => {
      throw lockedError();
    });

    assert.equal(await migrate(modules, 'guest', 'user'), userCart);
    assert.equal((modules.orders.moveCartPositions as any).mock.callCount(), 0);
    assert.equal((modules.orders.setCartOwner as any).mock.callCount(), 0);
  });

  it('rethrows a lock error of the merge itself and releases the lock', async () => {
    const release = mock.fn();
    const carts = { guest: { _id: 'guest-cart' }, user: { _id: 'user-cart' } };
    const modules = modulesFor(carts, async () => ({ release }));

    await assert.rejects(migrate(modules, 'guest', 'user'), { cause: 'LOCKED' });
    assert.equal(release.mock.callCount(), 1);
  });
});
