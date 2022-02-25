import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureAssortmentsModule } from 'meteor/unchained:core-assortments';
import { AssortmentsModule } from '@unchainedshop/types/assortments';

describe('Test exports', () => {
  let module: AssortmentsModule;

  before(async () => {
    const db = await initDb();
    module = await configureAssortmentsModule({ db });
  });

  it('Insert assortment', async () => {
    const assortmentId = await module.create(
      {
        authorId: 'Test-User-1',
        isActive: true,
        isBase: true,
        isRoot: true,
        sequence: 13,
        slugs: ['Test'],
        tags: [],
        _cachedProductIds: [],
        title: 'Test',
        locale: 'de',
      },
      'Test-User-1'
    );

    assert.ok(assortmentId);

    const assortment = await module.findAssortment({ assortmentId });

    assert.ok(assortment);

    const deletedCount = await module.delete(assortmentId);
    assert.equal(deletedCount, 1);
  });
});
