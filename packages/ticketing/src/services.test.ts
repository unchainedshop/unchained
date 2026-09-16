import { test } from 'node:test';
import assert from 'node:assert/strict';
import services from './services.ts';

test('cancels tickets and marks the product cancelled through the product module API', async () => {
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
  const { cancelledCount } = await services.ticketing.cancelTicketsForProduct.call(
    modules as any,
    'product',
  );
  assert.equal(cancelledCount, 2);
  assert.deepEqual(invalidated, ['first', 'second']);
  assert.deepEqual(cancelled, ['first', 'second']);
  assert.equal(product.meta.cancelled, true);
});

test('both cancellation paths reimburse ticket units and validate issuance before mutation', async () => {
  for (const kind of ['event', 'ticket']) {
    const issued: any[] = [];
    let cancelled = false;
    let failIssuance = false;
    const token = { _id: 'token', productId: 'event', userId: 'buyer', quantity: 3 };
    const modules = {
      warehousing: {
        findTokens: async () => [token],
        findToken: async () => token,
        invalidateToken: async () => {
          cancelled = true;
        },
      },
      passes: {
        cancelTicket: async () => token,
        generateDiscountCode: async (amount: number, currency: string) => {
          if (failIssuance) throw new Error('issuance failed');
          issued.push([amount, currency]);
          return 'code';
        },
      },
      products: {
        update: async () => undefined,
        findProduct: async () => ({ _id: 'event' }),
        prices: { price: async () => ({ amount: 1999, currencyCode: 'CHF' }) },
      },
      worker: { addWork: async () => undefined },
    };
    const service =
      kind === 'event'
        ? services.ticketing.cancelTicketsForProduct
        : services.ticketing.cancelTicketWithDiscount;
    await service.call(modules as any, kind, {
      generateDiscount: true,
      countryCode: 'CH',
      currencyCode: 'CHF',
    });
    assert.deepEqual(issued, [[5997, 'CHF']]);
    assert.equal(cancelled, true);
    cancelled = false;
    failIssuance = true;
    await assert.rejects(
      service.call(modules as any, kind, {
        generateDiscount: true,
        countryCode: 'CH',
        currencyCode: 'CHF',
      }),
      /issuance failed/,
    );
    assert.equal(cancelled, false);
  }
});
