import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { ordersSettings, type Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { replaceCartProductsService } from './replaceCartProducts.ts';

describe('replaceCartProductsService', () => {
  it('validates the quantity changes, then updates, adds and deletes positions', async (t) => {
    const validateOrderPosition = t.mock.method(
      ordersSettings,
      'validateOrderPosition',
      async () => undefined,
    );
    const positions = {
      findOrderPositions: async () => [
        { _id: 'kept', originalProductId: 'a', productId: 'a', quantity: 2 },
        { _id: 'removed', originalProductId: 'b', productId: 'b', quantity: 1 },
      ],
      updateProductItem: mock.fn(),
      addProductItem: mock.fn(),
      delete: mock.fn(),
    };
    const modules = {
      orders: { positions },
      products: {
        findProduct: async ({ productId }: { productId: string }) => ({ _id: productId }),
        resolveOrderableProduct: async (product: unknown) => product,
      },
    } as unknown as Modules;

    await replaceCartProductsService.call(modules, {
      order: { _id: 'order-id' } as Order,
      items: [
        { productId: 'a', quantity: 3 },
        { productId: 'a', quantity: 1 },
        { productId: 'c', quantity: 1 },
      ],
    });

    assert.deepEqual(
      validateOrderPosition.mock.calls.map(({ arguments: [{ product, quantityDiff }] }) => [
        (product as { _id: string })._id,
        quantityDiff,
      ]),
      [
        ['a', 2],
        ['c', 1],
      ],
    );
    assert.deepEqual(positions.delete.mock.calls[0].arguments, ['removed']);
    assert.deepEqual(positions.updateProductItem.mock.calls[0].arguments, [
      { orderPositionId: 'kept', quantity: 4, configuration: null },
    ]);
    assert.equal(positions.addProductItem.mock.calls[0].arguments[0].productId, 'c');
  });

  it('writes nothing when an item is invalid', async () => {
    const positions = {
      findOrderPositions: async () => [],
      updateProductItem: mock.fn(),
      addProductItem: mock.fn(),
      delete: mock.fn(),
    };
    const modules = {
      orders: { positions },
      products: { findProduct: async () => null },
    } as unknown as Modules;

    await assert.rejects(
      replaceCartProductsService.call(modules, {
        order: { _id: 'order-id' } as Order,
        items: [{ productId: 'missing', quantity: 1 }],
      }),
      { name: 'ProductNotFoundError' },
    );
    assert.equal(positions.addProductItem.mock.callCount() + positions.delete.mock.callCount(), 0);
  });
});
