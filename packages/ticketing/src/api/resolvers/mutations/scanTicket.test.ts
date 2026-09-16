import { test } from 'node:test';
import assert from 'node:assert/strict';
import scanTicket from './scanTicket.ts';

test('scanning rejects missing, inactive, cancelled, redeemed and ineligible tickets', async () => {
  const token = { _id: 'ticket', productId: 'event' };
  const product = { _id: 'event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' };
  for (const scenario of [
    { tokenId: '' },
    { token: null },
    { product: null },
    { product: { ...product, type: 'SIMPLE_PRODUCT' } },
    { product: { ...product, status: 'DRAFT' } },
    { product: { ...product, meta: { cancelled: true } } },
    { token: { ...token, meta: { cancelled: true } } },
    { token: { ...token, invalidatedDate: new Date() } },
    { eligible: false },
    { user: { guest: true } },
    { user: undefined },
  ]) {
    const data = {
      token,
      product,
      tokenId: 'ticket',
      eligible: true,
      user: { guest: false },
      ...scenario,
    };
    let invalidations = 0;
    const context = {
      userId: 'scanner',
      user: data.user,
      modules: {
        products: { findProduct: async () => data.product },
        warehousing: {
          findToken: async () => data.token,
          invalidateToken: async () => {
            invalidations += 1;
          },
        },
      },
      services: { warehousing: { isTokenInvalidateable: async () => data.eligible } },
    } as any;
    await assert.rejects(scanTicket(undefined as never, { tokenId: data.tokenId }, context));
    assert.equal(invalidations, 0);
  }
});
