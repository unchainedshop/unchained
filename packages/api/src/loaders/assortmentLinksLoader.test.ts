import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { UnchainedCore } from '@unchainedshop/core';
import type { AssortmentLink } from '@unchainedshop/core-assortments';
import assortmentLinksLoader from './assortmentLinksLoader.ts';

const LINKS = [
  { _id: 'p1-c1', parentAssortmentId: 'p1', childAssortmentId: 'c1' },
  { _id: 'p1-c2', parentAssortmentId: 'p1', childAssortmentId: 'c2' },
  { _id: 'p2-c1', parentAssortmentId: 'p2', childAssortmentId: 'c1' },
  { _id: 'p3-p2', parentAssortmentId: 'p3', childAssortmentId: 'p2' },
  { _id: 'special', parentAssortmentId: 'constructor', childAssortmentId: '__proto__' },
] as AssortmentLink[];

const createLoader = () => {
  const calls: Record<string, string[]>[] = [];
  const unchainedAPI = {
    modules: {
      assortments: {
        links: {
          findLinks: async (query: {
            parentAssortmentIds?: string[];
            childAssortmentIds?: string[];
            assortmentIds?: string[];
          }) => {
            calls.push(query);
            return LINKS.filter(
              ({ parentAssortmentId, childAssortmentId }) =>
                query.parentAssortmentIds?.includes(parentAssortmentId) ||
                query.childAssortmentIds?.includes(childAssortmentId) ||
                query.assortmentIds?.includes(parentAssortmentId) ||
                query.assortmentIds?.includes(childAssortmentId),
            );
          },
        },
      },
    },
  } as unknown as UnchainedCore;

  return { loader: assortmentLinksLoader(unchainedAPI), calls };
};

describe('assortmentLinksLoader', () => {
  it('keeps parent-only and child-only lookups directional', async () => {
    const { loader, calls } = createLoader();

    const [children, parents] = await Promise.all([
      loader.load({ parentAssortmentId: 'p1' }),
      loader.load({ childAssortmentId: 'c1' }),
    ]);

    assert.deepStrictEqual(calls, [
      {
        parentAssortmentIds: ['p1'],
        childAssortmentIds: ['c1'],
      },
    ]);
    assert.deepStrictEqual(
      children.map(({ _id }) => _id),
      ['p1-c1', 'p1-c2'],
    );
    assert.deepStrictEqual(
      parents.map(({ _id }) => _id),
      ['p1-c1', 'p2-c1'],
    );
  });

  it('uses the bidirectional query only when both directions are requested', async () => {
    const { loader, calls } = createLoader();

    const links = await loader.load({ assortmentId: 'p2' });

    assert.deepStrictEqual(calls, [{ assortmentIds: ['p2'] }]);
    assert.deepStrictEqual(
      links.map(({ _id }) => _id),
      ['p2-c1', 'p3-p2'],
    );
  });

  it('supports IDs that overlap Object prototype property names', async () => {
    const { loader } = createLoader();

    const [children, parents] = await Promise.all([
      loader.load({ parentAssortmentId: 'constructor' }),
      loader.load({ childAssortmentId: '__proto__' }),
    ]);

    assert.deepStrictEqual(
      children.map(({ _id }) => _id),
      ['special'],
    );
    assert.deepStrictEqual(
      parents.map(({ _id }) => _id),
      ['special'],
    );
  });
});
