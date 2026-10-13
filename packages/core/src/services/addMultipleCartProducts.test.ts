import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import type { Modules } from '../modules.ts';
import { addMultipleCartProductsService } from './addMultipleCartProducts.ts';

test('addMultipleCartProducts adds nothing when a product does not exist', async () => {
  const addProductItem = mock.fn();
  const modules = {
    orders: { positions: { addProductItem } },
    products: {
      findProduct: async ({ productId }) => (productId === 'missing' ? null : { _id: productId }),
      resolveOrderableProduct: async (product) => product,
    },
  } as unknown as Modules;
  const items = ['product', 'missing'].map((productId) => ({ productId, quantity: 1 }));
  await assert.rejects(addMultipleCartProductsService.call(modules, { order: { _id: 'cart' }, items }), {
    name: 'ProductNotFoundError',
  });
  assert.equal(addProductItem.mock.callCount(), 0);
});
