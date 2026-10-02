import { test } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createAnonymousGraphqlFetch, disconnect } from './helpers.js';

let db;
let graphqlFetch;

// The request currency is the default currency of the request country
test.describe('Locale: currency of the request country', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createAnonymousGraphqlFetch();
    await db.collection('products').updateOne(
      { _id: 'simpleproduct' },
      {
        $push: {
          'commerce.pricing': {
            amount: 9000,
            minQuantity: 0,
            isTaxable: true,
            isNetPrice: false,
            currencyCode: 'EUR',
            countryCode: 'DE',
          },
        },
      },
    );
  });

  test.after(async () => {
    await disconnect();
  });

  test('prices in the default currency of the request country', async () => {
    const { data, errors } = await graphqlFetch({
      headers: { 'x-shop-country': 'DE' },
      query: /* GraphQL */ `
        query {
          shopInfo {
            country {
              isoCode
            }
          }
          product(productId: "simpleproduct") {
            ... on SimpleProduct {
              catalogPrice {
                amount
                currencyCode
              }
            }
          }
        }
      `,
    });
    assert.equal(errors, undefined);
    assert.equal(data.shopInfo.country.isoCode, 'DE');
    assert.deepStrictEqual(data.product.catalogPrice, { amount: 9000, currencyCode: 'EUR' });
  });
});
