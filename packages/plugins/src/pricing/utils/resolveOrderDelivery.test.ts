import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import resolveOrderDelivery from './resolveOrderDelivery.ts';

const orderDelivery = { _id: 'priced' } as any;
const modules = {
  orders: {
    deliveries: {
      findDelivery: async ({ orderDeliveryId }) => ({ _id: orderDeliveryId }) as any,
    },
  },
};

describe('resolveOrderDelivery', () => {
  it('returns the order delivery being priced', async () => {
    assert.equal(
      await resolveOrderDelivery({ orderDelivery, order: { deliveryId: 'other' } as any, modules }),
      orderDelivery,
    );
  });

  it('falls back to the current delivery of the order', async () => {
    assert.deepEqual(await resolveOrderDelivery({ order: { deliveryId: 'current' } as any, modules }), {
      _id: 'current',
    });
  });

  it('returns null without an order delivery', async () => {
    assert.equal(await resolveOrderDelivery({ modules }), null);
    assert.equal(await resolveOrderDelivery({ order: {} as any, modules }), null);
  });
});
