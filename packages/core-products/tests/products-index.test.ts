import { assert } from 'chai';
import { initDb } from '@unchainedshop/mongodb';
import { configureProductsModule } from '@unchainedshop/core-products';
import { ProductsModule } from '@unchainedshop/types/products';

describe('Test exports', () => {
  let module: ProductsModule;

  before(async () => {
    const db = await initDb();
    module = await configureProductsModule({ db }).catch((error) => {
      console.error(error);

      throw error;
    });
  });

  it('Insert product', async () => {
    let product = await module.create(
      {
        authorId: 'Test-User-1',
        sequence: 13,
        slugs: ['Test'],
        tags: [],
        title: 'Test',
        locale: 'de',
        bundleItems: [],
        plan: {},
        proxy: {
          assignments: [],
        },
        supply: {},
        type: 'SimpleProduct',
      },
      'Test-User-1'
    );

    assert.ok(product);
    const productId = product._id;
    product = await module.findProduct({ productId });

    assert.ok(product);

    const deletedCount = await module.delete(productId);
    assert.equal(deletedCount, 1);
  });
});
