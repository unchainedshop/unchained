import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import {
  configureFiltersModule,
  FilterType,
} from 'meteor/unchained:core-filters';
import { configureProductsModule } from 'meteor/unchained:core-products';
import { dbIdToString } from 'meteor/unchained:utils';
import { FiltersModule } from '@unchainedshop/types/filters';
import { Context } from '@unchainedshop/types/api';
import { ProductsModule } from '@unchainedshop/types/products';

describe('Test exports', () => {
  const context: {
    modules: {
      filters: FiltersModule;
      products: ProductsModule;
    };
  } = {
    modules: {
      filters: null,
      products: null,
    },
  };
  let filterId: string;

  before(async () => {
    const db = initDb();
    context.modules.filters = await configureFiltersModule({ db }).catch(
      (error) => {
        console.error(error);

        throw error;
      }
    );
    context.modules.products = await configureProductsModule({ db }).catch(
      (error) => {
        console.error(error);

        throw error;
      }
    );
  });

  afterEach(async () => {
    if (filterId) {
      await context.modules.filters.delete(filterId, context as Context);
    }
  });

  it('Insert filter', async () => {
    const newFilter = await context.modules.filters.create(
      {
        authorId: 'Test-User-1',
        isActive: true,
        key: 'Test',
        options: [],
        type: FilterType.SINGLE_CHOICE,
        title: 'My Test Filter',
        locale: 'en',
      },
      context as Context
    );

    assert.ok(newFilter);
    filterId = dbIdToString(newFilter._id);
    const filter = await context.modules.filters.findFilter({
      filterId,
    });

    assert.ok(filter);

    const deletedCount = await context.modules.filters.delete(
      filterId,
      context as Context
    );
    assert.equal(deletedCount, 1);
    filterId = null;
  });
});
