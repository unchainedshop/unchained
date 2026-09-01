import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { actions } from '../../../roles/index.ts';
import globalSearch from './globalSearch.ts';

describe('globalSearch resolver', () => {
  it('deduplicates entity types and clamps the effective limit passed to ACL and modules', async () => {
    const findProducts = mock.fn(async () => []);
    const countProducts = mock.fn(async () => 0);
    const userHasPermission = mock.fn(async () => true);
    const context = {
      userId: 'admin',
      roles: { userHasPermission },
      modules: {
        products: {
          findProducts,
          count: countProducts,
        },
      },
    } as any;

    await globalSearch(
      undefined as never,
      {
        query: '  simple  ',
        types: ['PRODUCT', 'PRODUCT'],
        limit: 500,
        typeLimits: [{ type: 'PRODUCT', limit: 1000 }],
        includeDraftProducts: false,
      },
      context,
    );

    const effectiveParams = {
      queryString: 'simple',
      limit: 50,
      offset: 0,
      includeDrafts: false,
    };
    assert.strictEqual(userHasPermission.mock.calls.length, 1);
    assert.strictEqual(userHasPermission.mock.calls[0].arguments[1], actions.viewProducts);
    assert.deepStrictEqual(userHasPermission.mock.calls[0].arguments[2], [undefined, effectiveParams]);
    assert.deepStrictEqual(findProducts.mock.calls[0].arguments[0], effectiveParams);
    assert.strictEqual(findProducts.mock.calls.length, 1);
    assert.strictEqual(countProducts.mock.calls.length, 1);
  });
});
