import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TokenWrongStatusError } from '@unchainedshop/api';
import scanTicket from './scanTicket.ts';

const token = { _id: 'ticket', productId: 'event' };
const product = { _id: 'event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' };

function createContext(data: {
  token?: any;
  product?: any;
  eligible?: boolean;
  invalidateToken?: () => Promise<any>;
}) {
  return {
    userId: 'scanner',
    modules: {
      products: { findProduct: async () => data.product },
      warehousing: {
        findToken: async () => data.token,
        invalidateToken: data.invalidateToken,
      },
    },
    services: { warehousing: { isTokenInvalidateable: async () => data.eligible } },
  } as any;
}

test('scanning rejects missing, inactive, cancelled, redeemed and ineligible tickets', async () => {
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
  ]) {
    let invalidations = 0;
    const data = { token, product, tokenId: 'ticket', eligible: true, ...scenario };
    const context = createContext({
      ...data,
      invalidateToken: async () => {
        invalidations += 1;
      },
    });
    await assert.rejects(scanTicket(undefined as never, { tokenId: data.tokenId }, context));
    assert.equal(invalidations, 0);
  }
});

test('a ticket redeemed concurrently at another gate is reported as already redeemed', async () => {
  const context = createContext({ token, product, eligible: true, invalidateToken: async () => null });
  await assert.rejects(
    scanTicket(undefined as never, { tokenId: token._id }, context),
    TokenWrongStatusError,
  );
});
