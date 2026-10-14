import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { Modules } from '../modules.ts';
import { checkoutOrderService } from './checkoutOrder.ts';

const modulesFor = (order: unknown, events: string[]) =>
  ({
    orders: {
      acquireLock: mock.fn(async () => {
        events.push('lock');
        return { release: async () => events.push('release') };
      }),
      findOrder: async () => {
        events.push('read');
        return order;
      },
    },
  }) as unknown as Modules;

describe('checkoutOrderService', () => {
  it('reads the order under the lock and returns orders that left the cart', async () => {
    const events: string[] = [];
    const confirmedOrder = { _id: 'order-id', status: 'CONFIRMED' };
    const modules = modulesFor(confirmedOrder, events);

    assert.equal(await checkoutOrderService.call(modules, 'order-id', {}), confirmedOrder);
    assert.equal(await checkoutOrderService.call(modulesFor(null, []), 'missing-id', {}), null);
    assert.deepEqual(events, ['lock', 'read', 'release']);
    assert.deepEqual((modules.orders.acquireLock as any).mock.calls[0].arguments, [
      'order-id',
      'checkout',
    ]);
  });

  it('releases the lock when the cart cannot be checked out', async () => {
    const events: string[] = [];
    await assert.rejects(
      checkoutOrderService.call(modulesFor({ _id: 'order-id', status: null }, events), 'order-id', {}),
      { name: 'ContactMissingError' },
    );
    assert.deepEqual(events, ['lock', 'read', 'release']);
  });
});
