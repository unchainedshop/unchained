import { assert } from 'chai';
import { initDb } from '@unchainedshop/mongodb';
import {
  configureFiltersModule,
  FilterType,
} from '@unchainedshop/core-filters';
import { configureProductsModule } from '@unchainedshop/core-products';
import { FiltersModule } from '@unchainedshop/types/filters';
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
    const db = await initDb();
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
      await context.modules.filters.delete(filterId);
    }
  });

  it('Insert filter', async () => {
    const newFilter = await context.modules.filters.create(
      {
        isActive: true,
        key: 'Test',
        options: [],
        type: FilterType.SINGLE_CHOICE,
        title: 'My Test Filter',
        locale: 'en',
      },
      context,
      { skipInvalidation: true },
      'Test-User-1'
    );

    assert.ok(newFilter);

    const filter = await context.modules.filters.findFilter({
      filterId: newFilter._id,
    });

    assert.ok(filter);

    const deletedCount = await context.modules.filters.delete(
      filterId,
    );
    assert.equal(deletedCount, 1);
    filterId = null;
  });
});
