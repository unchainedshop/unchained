import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { GraphQLError } from 'graphql';
import checkoutCart from './checkoutCart.ts';

const buildContext = (checkoutOrder: () => Promise<any>) => {
  const order = { _id: 'order-1' };
  return {
    user: { _id: 'user-1' },
    userId: 'user-1',
    countryCode: 'CH',
    services: {
      orders: {
        findOrInitCart: mock.fn(async () => order),
        checkoutOrder: mock.fn(checkoutOrder),
      },
    },
  } as any;
};

describe('checkoutCart resolver', () => {
  it('returns the checked-out order on success', async () => {
    const sentinel = { _id: 'order-1', status: 'CONFIRMED' };
    const context = buildContext(async () => sentinel);
    const result = await checkoutCart(null as never, { orderId: 'order-1' }, context);
    assert.deepStrictEqual(result, sentinel);
  });

  it('throws OrderNotFoundError when no cart can be found or initialised', async () => {
    const context = buildContext(async () => ({}));
    context.services.orders.findOrInitCart = mock.fn(async () => null);
    await assert.rejects(
      () => checkoutCart(null as never, { orderId: 'missing' }, context),
      (error: any) => {
        assert.strictEqual(error.extensions?.code, 'OrderNotFoundError');
        return true;
      },
    );
  });

  it('preserves a createError() business code in detailCode (not "GraphQLError")', async () => {
    // GraphQLError subclass: real code lives in extensions.code, .name is "GraphQLError".
    const ProductNotOrderableError = new GraphQLError('Product is not (or no longer) orderable', {
      extensions: { code: 'ProductNotOrderable', productId: 'product-1' },
    });
    const context = buildContext(async () => {
      throw ProductNotOrderableError;
    });
    await assert.rejects(
      () => checkoutCart(null as never, { orderId: 'order-1' }, context),
      (error: any) => {
        assert.strictEqual(error.extensions?.code, 'OrderCheckoutError');
        assert.strictEqual(error.extensions?.detailCode, 'ProductNotOrderable');
        assert.strictEqual(error.extensions?.detailMessage, 'Product is not (or no longer) orderable');
        return true;
      },
    );
  });

  it('falls back to error.name for createServiceError() errors', async () => {
    // createServiceError sets `.name` to the code on a plain Error (no extensions).
    const serviceError: any = new Error('Quotation expired or fulfilled');
    serviceError.name = 'QuotationInvalidError';
    const context = buildContext(async () => {
      throw serviceError;
    });
    await assert.rejects(
      () => checkoutCart(null as never, { orderId: 'order-1' }, context),
      (error: any) => {
        assert.strictEqual(error.extensions?.code, 'OrderCheckoutError');
        assert.strictEqual(error.extensions?.detailCode, 'QuotationInvalidError');
        return true;
      },
    );
  });
});
