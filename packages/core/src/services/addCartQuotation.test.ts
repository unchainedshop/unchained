import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
import registerQuotation from '../factory/registerQuotation.ts';
import { addCartQuotationService } from './addCartQuotation.ts';
import type { Modules } from '../modules.ts';

// The quotation adapter's transformItemConfiguration decides the total quantity of the
// quotation's line, so an adapter can bind the quotation to the quoted quantity
const setup = (
  existingQuantity?: number,
  {
    existingConfiguration = [],
    lineDeleted = false,
  }: { existingConfiguration?: any[]; lineDeleted?: boolean } = {},
) => {
  const order = { _id: 'order-1', userId: 'user-1', currencyCode: 'CHF', status: null } as any;
  const quotation = {
    _id: 'quotation-1',
    status: 'PROPOSED',
    userId: 'user-1',
    productId: 'product-1',
    currencyCode: 'CHF',
    configuration: [],
    quantity: 100,
  } as any;
  const existing =
    existingQuantity === undefined
      ? []
      : [
          {
            _id: 'position-1',
            orderId: order._id,
            quotationId: quotation._id,
            quantity: existingQuantity,
            configuration: existingConfiguration,
          },
        ];
  const positions = {
    findOrderPositions: mock.fn(async () => existing),
    addProductItem: mock.fn(async () => ({ _id: 'position-new' })),
    updateProductItem: mock.fn(async ({ orderPositionId }) =>
      lineDeleted ? null : { _id: orderPositionId },
    ),
  };
  const modules = {
    orders: { positions },
    products: { findProduct: async () => ({ _id: 'product-1' }), isActive: () => true },
  } as unknown as Modules;
  const addCartQuotation = (params: { quantity?: number; configuration?: any[] } = {}) =>
    addCartQuotationService.call(modules, { order, quotation, ...params });
  return { addCartQuotation, positions };
};

describe('addCartQuotation service', () => {
  afterEach(() => {
    pluginRegistry.clear();
  });

  it('a fixed-quantity adapter keeps the line at the quoted quantity when the quotation is added again', async () => {
    const transformed: number[] = [];
    registerQuotation({
      adapterId: 'fixed-quantity',
      transformItemConfiguration: async (params, { quotation }) => {
        transformed.push(params.quantity!);
        return { quantity: quotation!.quantity, configuration: params.configuration };
      },
    });
    const { addCartQuotation, positions } = setup(100);

    await addCartQuotation();

    assert.deepEqual(transformed, [200]);
    assert.equal(positions.addProductItem.mock.callCount(), 0);
    assert.equal(positions.updateProductItem.mock.calls[0].arguments[0].quantity, 100);
  });

  it('adds a new line with the quantity the adapter returns', async () => {
    registerQuotation({ adapterId: 'default' });
    const { addCartQuotation, positions } = setup();

    await addCartQuotation({ quantity: 200 });

    assert.equal(positions.addProductItem.mock.calls[0].arguments[0].quantity, 200);
  });

  it('an adapter that returns no quantity leaves the line at the requested total', async () => {
    registerQuotation({
      adapterId: 'configuration-only',
      transformItemConfiguration: async ({ configuration }) => ({ configuration }),
    });
    const { addCartQuotation, positions } = setup(200);

    await addCartQuotation();

    assert.equal(positions.updateProductItem.mock.calls[0].arguments[0].quantity, 300);
  });

  it('adding the quotation again without a configuration keeps the configuration of its line', async () => {
    registerQuotation({
      adapterId: 'pass-through',
      transformItemConfiguration: async ({ quantity, configuration }) => ({ quantity, configuration }),
    });
    const configuration = [{ key: 'length', value: '5' }];
    const { addCartQuotation, positions } = setup(100, { existingConfiguration: configuration });

    await addCartQuotation();

    assert.deepEqual(
      positions.updateProductItem.mock.calls[0].arguments[0].configuration,
      configuration,
    );
  });

  it('fails with OrderItemNotFoundError when the line was removed meanwhile', async () => {
    registerQuotation({ adapterId: 'default' });
    const { addCartQuotation } = setup(100, { lineDeleted: true });

    await assert.rejects(() => addCartQuotation(), { name: 'OrderItemNotFoundError' });
  });
});
