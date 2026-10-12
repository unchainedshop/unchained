import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { addMultipleCartProductsService } from './addMultipleCartProducts.ts';

describe('addMultipleCartProductsService', () => {
  it('checks every item before adding any', async () => {
    const addProductItem = mock.fn();
    const modules = {
      orders: { positions: { addProductItem } },
      products: {
        findProduct: async ({ productId }: { productId: string }) =>
          productId === 'missing' ? null : { _id: productId },
        resolveOrderableProduct: async (product: unknown) => product,
      },
    } as unknown as Modules;

    await assert.rejects(
      addMultipleCartProductsService.call(modules, {
        order: { _id: 'order-id' } as Order,
        items: [
          { productId: 'product-id', quantity: 1 },
          { productId: 'missing', quantity: 1 },
        ],
      }),
      { name: 'ProductNotFoundError', details: { productId: 'missing' } },
    );
    assert.equal(addProductItem.mock.callCount(), 0);
  });
});
