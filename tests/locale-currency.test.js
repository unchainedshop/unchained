import { test } from 'node:test';
import assert from 'node:assert';
import { resolveDefaultContext } from '@unchainedshop/api';
import { configureCurrenciesModule } from '@unchainedshop/core-currencies';
import { setupDatabase, createAnonymousGraphqlFetch, disconnect } from './helpers.js';
import { getTestPlatform } from './setup.js';

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

  test('identical request headers resolve currency precision independently for each shop', async () => {
    const { unchainedAPI } = getTestPlatform();
    const otherDb = db.client.db('other-shop-locale');
    const currencies = await configureCurrenciesModule({ db: otherDb });
    await otherDb.collection('currencies').insertOne({ isoCode: 'CHF', decimals: 3, isActive: true });
    const otherShop = { ...unchainedAPI, modules: { ...unchainedAPI.modules, currencies } };
    const headers = { acceptLang: 'de', acceptCountry: 'CH' };
    const [first, second] = await Promise.all(
      [unchainedAPI, otherShop].map((shop) => resolveDefaultContext(headers, shop)),
    );
    assert.equal(first.getCurrencyDecimals('CHF'), 2);
    assert.equal(first.getCurrencyDecimals('GBP'), 2);
    assert.equal(second.getCurrencyDecimals('CHF'), 3);
    assert.equal(resolveDefaultContext.delete('de-CH'), true);
    assert.equal(resolveDefaultContext.delete('de-CH'), false);
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
