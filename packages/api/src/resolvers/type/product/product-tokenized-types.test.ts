import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TokenizedProduct } from './product-tokenized-types.ts';

test('tokens and tokensCount pass the product to viewTokens rules', async () => {
  const product = { _id: 'tokenized-product', type: 'TOKENIZED_PRODUCT' } as any;
  const checks: [string, unknown][] = [];
  const context = {
    roles: {
      userHasPermission: async (_context: unknown, action: string, [root]: unknown[]) => {
        checks.push([action, root]);
        return true;
      },
    },
    modules: {
      warehousing: {
        findTokens: async ({ productId }: { productId: string }) => [{ _id: 'token', productId }],
        tokensCount: async () => 1,
      },
    },
  } as any;

  assert.deepEqual(await TokenizedProduct.tokens(product, undefined as never, context), [
    { _id: 'token', productId: product._id },
  ]);
  assert.equal(await TokenizedProduct.tokensCount(product, undefined as never, context), 1);
  assert.deepEqual(checks, [
    ['viewTokens', product],
    ['viewTokens', product],
  ]);
});
