import { setupDatabase, createAnonymousGraphqlFetch, disconnect } from './helpers.js';
import { SimpleProduct } from './seeds/products.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;

test.describe('Public Queries', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test('products', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          products {
            _id
          }
        }
      `,
    });

    assert.strictEqual(errors, undefined);
    assert.ok(data.products.length > 0);

    const [product] = data.products;
    assert.deepStrictEqual(product, {
      _id: SimpleProduct._id,
    });
  });

  test('product', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          product(productId: "simpleproduct") {
            _id
          }
        }
      `,
    });

    assert.strictEqual(errors, undefined);
    const { product } = data;
    assert.deepStrictEqual(product, {
      _id: SimpleProduct._id,
    });
  });

  test('query.productCatalogPrices', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          productCatalogPrices(productId: "simpleproduct") {
            amount
            currency {
              _id
              isoCode
            }
          }
        }
      `,
    });

    assert.strictEqual(errors, undefined);
    assert.partialDeepStrictEqual(data.productCatalogPrices[0], {
      amount: 10000,
      currency: {
        isoCode: 'CHF',
      },
    });
  });

  test('query.productCatalogPrices return error when passed invalid productId', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          productCatalogPrices(productId: "") {
            amount
            currency {
              _id
              isoCode
            }
          }
        }
      `,
    });

    assert.strictEqual(data, null);
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });
});
