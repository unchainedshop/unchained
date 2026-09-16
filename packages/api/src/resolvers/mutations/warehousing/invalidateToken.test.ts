import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { WarehousingDirector } from '@unchainedshop/core';
import invalidateToken from './invalidateToken.ts';

const token = { _id: 'token-1', productId: 'product-1', quantity: 1 };

const buildContext = (overrides: { token?: any; invalidateToken?: () => Promise<any> }) =>
  ({
    userId: 'admin',
    modules: {
      warehousing: {
        findToken: mock.fn(async () => overrides.token ?? token),
        allProviders: mock.fn(async () => []),
        invalidateToken: mock.fn(
          overrides.invalidateToken ?? (async () => ({ ...token, invalidatedDate: new Date() })),
        ),
      },
      products: { findProduct: mock.fn(async () => ({ _id: token.productId })) },
    },
  }) as any;

const expectTokenWrongStatus = (error: any) => {
  assert.strictEqual(error.extensions?.code, 'TokenWrongStatusError');
  return true;
};

describe('invalidateToken resolver', () => {
  it('rejects an already invalidated token before consulting any provider', async () => {
    const context = buildContext({ token: { ...token, invalidatedDate: new Date() } });
    await assert.rejects(
      () => invalidateToken(null as never, { tokenId: token._id }, context),
      expectTokenWrongStatus,
    );
    assert.strictEqual(context.modules.warehousing.allProviders.mock.callCount(), 0);
    assert.strictEqual(context.modules.warehousing.invalidateToken.mock.callCount(), 0);
  });

  it('reports a token invalidated concurrently as already invalidated', async (t) => {
    t.mock.method(WarehousingDirector, 'isInvalidateable', async () => true);
    const context = buildContext({ invalidateToken: async () => null });
    await assert.rejects(
      () => invalidateToken(null as never, { tokenId: token._id }, context),
      expectTokenWrongStatus,
    );
  });

  it('returns the invalidated token', async (t) => {
    t.mock.method(WarehousingDirector, 'isInvalidateable', async () => true);
    const context = buildContext({});
    const result = await invalidateToken(null as never, { tokenId: token._id }, context);
    assert.ok(result.invalidatedDate);
  });
});
