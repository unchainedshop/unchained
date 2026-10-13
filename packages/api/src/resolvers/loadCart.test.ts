import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Context } from '../context.ts';
import { lockCart } from './loadCart.ts';

const contextFor = (reads: unknown[], acquireLock: () => Promise<unknown>) =>
  ({
    services: { orders: { findOrInitCart: async () => reads.shift() } },
    modules: { orders: { isCart: ({ status }) => status === null, acquireLock } },
  }) as unknown as Context;

describe('lockCart', () => {
  it('holds the checkout lock until the cart is disposed', async () => {
    const events: string[] = [];
    const cart = { _id: 'cart-id', status: null };
    const context = contextFor([cart, cart], async () => ({
      release: async () => events.push('release'),
    }));

    {
      await using lockedCart = await lockCart(context, 'cart-id');
      events.push(`write ${lockedCart._id}`);
    }
    assert.deepEqual(events, ['write cart-id', 'release']);
  });

  it('rejects a cart checked out while waiting for the lock and releases the lock', async () => {
    const events: string[] = [];
    const context = contextFor(
      [
        { _id: 'cart-id', status: null },
        { _id: 'cart-id', status: 'CONFIRMED' },
      ],
      async () => ({ release: async () => events.push('release') }),
    );

    await assert.rejects(lockCart(context, 'cart-id'), {
      extensions: { code: 'OrderWrongStatusError', status: 'CONFIRMED' },
    });
    assert.deepEqual(events, ['release']);
  });

  it('reports a cart that stays locked', async () => {
    const context = contextFor([{ _id: 'cart-id', status: null }], async () => {
      throw new Error('Could not acquire lock order:checkout:cart-id', { cause: 'LOCKED' });
    });

    await assert.rejects(lockCart(context, 'cart-id'), {
      extensions: { code: 'OrderLockedError', orderId: 'cart-id' },
    });
  });
});
