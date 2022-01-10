import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureFiltersModule } from 'meteor/unchained:core-filters';
import { FiltersModule } from '@unchainedshop/types/filters';

describe('Test exports', () => {
  let module: FiltersModule;

  before(async () => {
    const db = initDb();
    module = await configureFiltersModule({ db }).catch((error) => {
      console.error(error);
    });
  });

  it('Insert filter', async () => {
    const filterId = await module.create(
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

    assert.ok(filterId);

    const filter = await module.findFilter({ filterId });

    assert.ok(filter);

    const deletedCount = await module.delete(filterId);
    assert.equal(deletedCount, 1);
  });
});
