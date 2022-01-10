import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import {
  configureFiltersModule,
  FilterType,
} from 'meteor/unchained:core-filters';
import { dbIdToString } from 'meteor/unchained:utils';
import { FiltersModule } from '@unchainedshop/types/filters';
import { Context } from '@unchainedshop/types/api';

describe('Test exports', () => {
  let module: FiltersModule;
  let context = { userId: 'Test-User-1' } as Context;

  before(async () => {
    const db = initDb();
    module = await configureFiltersModule({ db });
  });

  it('Insert filter', async () => {
    const newFilter = await module.create(
      {
        authorId: 'Test-User-1',
        isActive: true,
        key: 'Test',
        options: [],
        type: FilterType.SINGLE_CHOICE,
        title: 'My Test Filter',
        locale: 'en',
      },
      context
    );

    assert.ok(newFilter);
    const filterId = dbIdToString(newFilter._id);
    const filter = await module.findFilter({
      filterId,
    });

    assert.ok(filter);

    const deletedCount = await module.delete(filterId, context);
    assert.equal(deletedCount, 1);
  });
});
