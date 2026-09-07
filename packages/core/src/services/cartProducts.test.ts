import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { ordersSettings } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import {
  addMultipleCartProductsService,
  replaceCartProductsService,
  updateCartProductService,
} from './cartProducts.ts';

const order = {
  _id: 'order-id',
  status: null,
  countryCode: 'CH',
  currencyCode: 'CHF',
} as any;
const product = { _id: 'product-id' } as any;
const context = { localeContext: new Intl.Locale('en-CH'), countryCode: 'CH' };

const createModules = (overrides: Record<string, any> = {}) =>
  ({
    orders: {
      findOrder: mock.fn(async () => order),
      isCart: () => true,
      positions: {
        addProductItem: mock.fn(),
        replaceProductItems: mock.fn(),
        findOrderPositions: mock.fn(async () => []),
        findOrderPosition: mock.fn(),
        updateProductItem: mock.fn(),
      },
    },
    products: {
      findProduct: mock.fn(async ({ productId }) =>
        productId === 'missing' ? null : { ...product, _id: productId },
      ),
      resolveOrderableProduct: mock.fn(async (value) => value),
    },
    ...overrides,
  }) as unknown as Modules;

describe('cart product services', () => {
  it('validates every add input before writing any position', async () => {
    const modules = createModules();

    await assert.rejects(
      addMultipleCartProductsService.call(modules, {
        orderId: order._id,
        items: [
          { productId: product._id, quantity: 1 },
          { productId: 'missing', quantity: 1 },
        ],
        context,
      }),
      { name: 'ProductNotFoundError' },
    );

    assert.equal(modules.orders.positions.addProductItem.mock.calls.length, 0);
  });

  it('aggregates replacements and validates their delta before replacing positions', async (t) => {
    const validationError = new Error('stop after validation');
    const validateOrderPosition = mock.fn(async () => {
      throw validationError;
    });
    t.mock.method(ordersSettings, 'validateOrderPosition', validateOrderPosition);
    const modules = createModules();
    modules.orders.positions.findOrderPositions = mock.fn(async () => [
      {
        originalProductId: product._id,
        productId: product._id,
        quantity: 2,
        configuration: null,
      },
    ]) as any;

    await assert.rejects(
      replaceCartProductsService.call(modules, {
        orderId: order._id,
        items: [
          { productId: product._id, quantity: 3 },
          { productId: product._id, quantity: 4 },
        ],
        context,
      }),
      validationError,
    );

    assert.equal(validateOrderPosition.mock.calls.length, 1);
    assert.equal(validateOrderPosition.mock.calls[0].arguments[0].quantityDiff, 5);
    assert.equal(modules.orders.positions.replaceProductItems.mock.calls.length, 0);
  });

  it('preserves omitted item fields and validates a zero quantity delta', async (t) => {
    const validationError = new Error('stop after validation');
    const validateOrderPosition = mock.fn(async () => {
      throw validationError;
    });
    t.mock.method(ordersSettings, 'validateOrderPosition', validateOrderPosition);
    const modules = createModules();
    modules.orders.positions.findOrderPosition = mock.fn(async () => ({
      _id: 'item-id',
      orderId: order._id,
      originalProductId: product._id,
      productId: product._id,
      quantity: 3,
      configuration: [{ key: 'size', value: 'M' }],
    })) as any;

    await assert.rejects(
      updateCartProductService.call(modules, {
        itemId: 'item-id',
        context,
      }),
      validationError,
    );

    assert.deepEqual(validateOrderPosition.mock.calls[0].arguments[0], {
      order,
      product,
      configuration: [{ key: 'size', value: 'M' }],
      quantityDiff: 0,
    });
    assert.equal(modules.orders.positions.updateProductItem.mock.calls.length, 0);
  });
});
