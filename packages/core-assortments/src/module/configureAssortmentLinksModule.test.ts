import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Collection, Filter, FindOptions } from 'mongodb';
import { configureAssortmentLinksModule } from './configureAssortmentLinksModule.ts';
import type { AssortmentLink } from '../db/AssortmentsCollection.ts';

const createModule = () => {
  const calls: { selector: Filter<AssortmentLink>; options?: FindOptions }[] = [];
  const AssortmentLinks = {
    find: (selector: Filter<AssortmentLink>, options?: FindOptions) => {
      calls.push({ selector, options });
      return { toArray: async () => [] };
    },
  } as unknown as Collection<AssortmentLink>;

  return {
    calls,
    module: configureAssortmentLinksModule({
      AssortmentLinks,
      invalidateCache: () => undefined,
    }),
  };
};

describe('configureAssortmentLinksModule.findLinks', () => {
  it('queries child IDs in the child direction only', async () => {
    const { module, calls } = createModule();

    await module.findLinks({ childAssortmentIds: ['child-1', 'child-2'] });

    assert.deepStrictEqual(calls[0].selector, {
      childAssortmentId: { $in: ['child-1', 'child-2'] },
    });
  });

  it('combines mixed directional batches without widening individual IDs', async () => {
    const { module, calls } = createModule();

    await module.findLinks({
      parentAssortmentIds: ['parent-1'],
      childAssortmentIds: ['child-1'],
      assortmentIds: ['both-1'],
    });

    assert.deepStrictEqual(calls[0].selector, {
      $or: [
        { parentAssortmentId: { $in: ['parent-1'] } },
        { childAssortmentId: { $in: ['child-1'] } },
        { parentAssortmentId: { $in: ['both-1'] } },
        { childAssortmentId: { $in: ['both-1'] } },
      ],
    });
  });
});
