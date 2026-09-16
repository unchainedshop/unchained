import assert from 'node:assert/strict';
import { it } from 'node:test';
import services from './services.ts';

it('cancels tickets and marks the product cancelled through the product module API', async () => {
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
  const count = await services.ticketing.cancelTicketsForProduct.call(modules as any, 'product');
  assert.equal(count, 2);
  assert.deepEqual(invalidated, ['first', 'second']);
  assert.deepEqual(cancelled, ['first', 'second']);
  assert.equal(product.meta.cancelled, true);
});
