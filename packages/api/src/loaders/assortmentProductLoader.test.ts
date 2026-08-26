import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { UnchainedCore } from '@unchainedshop/core';
import type { AssortmentProduct } from '@unchainedshop/core-assortments';
import assortmentProductLoader from './assortmentProductLoader.ts';

const ASSORTMENT_PRODUCTS = [
  { _id: 'a1-p1', assortmentId: 'a1', productId: 'p1' },
  { _id: 'a1-p2', assortmentId: 'a1', productId: 'p2' },
  { _id: 'a2-p2', assortmentId: 'a2', productId: 'p2' },
  { _id: 'ab-c', assortmentId: 'ab', productId: 'c' },
  { _id: 'a-bc', assortmentId: 'a', productId: 'bc' },
] as AssortmentProduct[];

const createLoader = () => {
  const calls: Record<string, unknown>[] = [];
  const unchainedAPI = {
    modules: {
      assortments: {
        products: {
          findAssortmentProducts: async (query: { assortmentIds: string[]; productIds: string[] }) => {
            calls.push(query);
            return ASSORTMENT_PRODUCTS.filter(
              ({ assortmentId, productId }) =>
                query.assortmentIds.includes(assortmentId) && query.productIds.includes(productId),
            );
          },
        },
      },
    },
  } as unknown as UnchainedCore;

  return { loader: assortmentProductLoader(unchainedAPI), calls };
};

describe('assortmentProductLoader', () => {
  it('constrains the batch query by both assortment and product IDs', async () => {
    const { loader, calls } = createLoader();

    const [first, second] = await Promise.all([
      loader.load({ assortmentId: 'a1', productId: 'p1' }),
      loader.load({ assortmentId: 'a2', productId: 'p2' }),
    ]);

    assert.deepStrictEqual(calls, [
      {
        assortmentIds: ['a1', 'a2'],
        productIds: ['p1', 'p2'],
      },
    ]);
    assert.strictEqual(first?._id, 'a1-p1');
    assert.strictEqual(second?._id, 'a2-p2');
  });

  it('keeps pair keys distinct when concatenated IDs would collide', async () => {
    const { loader } = createLoader();

    const [first, second] = await Promise.all([
      loader.load({ assortmentId: 'ab', productId: 'c' }),
      loader.load({ assortmentId: 'a', productId: 'bc' }),
    ]);

    assert.strictEqual(first?._id, 'ab-c');
    assert.strictEqual(second?._id, 'a-bc');
  });
});
