import assert from 'node:assert';
import test from 'node:test';
import { setupDatabase, createAnonymousGraphqlFetch, createLoggedInGraphqlFetch } from './helpers.js';
import { seedStorefrontCatalog } from './seeds/storefront.js';

const SearchProducts = /* GraphQL */ `
  query SearchProducts($filterQuery: [FilterQueryInput!]) {
    searchProducts(filterQuery: $filterQuery) {
      products(limit: 100) {
        _id
      }
      filters {
        definition {
          key
        }
        options {
          filteredProductsCount
          definition {
            value
          }
        }
      }
    }
  }
`;

const FilterOptions = /* GraphQL */ `
  query FilterOptions($filterId: ID) {
    filter(filterId: $filterId) {
      optionsAreGenerated
      options {
        value
      }
    }
  }
`;

let db;
let filterIds;
const adminGraphqlFetch = createLoggedInGraphqlFetch();

const search = async (country, filterQuery) => {
  const { data, errors } = await createAnonymousGraphqlFetch()({
    query: SearchProducts,
    variables: { filterQuery },
    headers: { 'x-shop-country': country },
  });
  assert.strictEqual(errors, undefined);
  return data.searchProducts;
};

const productIds = async (country, key, value) =>
  (await search(country, [{ key, value }])).products.map(({ _id }) => _id);

test.describe('Catalog price filter', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    filterIds = await seedStorefrontCatalog(db, adminGraphqlFetch);
  });

  test('matches inclusive bounds against the quantity-one price of each market', async () => {
    const swiss = await productIds('CH', 'price_ch', '0:5000');
    for (const productId of ['sf-mini-8', 'sf-at-limit', 'sf-ch-only', 'sf-configurable']) {
      assert.ok(swiss.includes(productId), productId);
    }
    assert.ok(!swiss.includes('sf-draft') && !swiss.includes('sf-hidden'));

    const german = await productIds('DE', 'price_de', '0:5000');
    assert.ok(german.includes('sf-at-limit') && german.includes('sf-configurable'));
    assert.ok(!german.includes('sf-mini-8') && !german.includes('sf-ch-only'));
  });

  test('accepts open bounds and bounds between prices', async () => {
    assert.deepStrictEqual(await productIds('CH', 'price_ch', '4000:4800'), ['sf-ch-only']);
    const upTo = await productIds('CH', 'price_ch', ':3500');
    assert.ok(upTo.includes('sf-configurable') && !upTo.includes('sf-mini-8'));
    const from = await productIds('CH', 'price_ch', '8000:');
    assert.ok(from.includes('sf-configurable') && !from.includes('sf-at-limit'));
  });

  test('matches a configurable product through its active variants only', async () => {
    assert.ok(!(await productIds('CH', 'price_ch', ':1500')).includes('sf-configurable'));
  });

  test('shows a request only the price filter of its market with a count per price', async () => {
    const { filters } = await search('CH', [{ key: 'price_ch', value: '0:5000' }]);
    const keys = filters.map(({ definition }) => definition.key);
    assert.ok(keys.includes('price_ch') && !keys.includes('price_de'));
    const histogram = filters.find(({ definition }) => definition.key === 'price_ch').options;
    assert.deepStrictEqual(
      histogram
        .filter(({ definition }) => ['3900', '4500'].includes(definition.value))
        .map(({ definition, filteredProductsCount }) => [definition.value, filteredProductsCount]),
      [
        ['3900', 1],
        ['4500', 1],
      ],
    );
  });

  test('lists generated options read-only for Admin UI', async () => {
    const { data } = await adminGraphqlFetch({
      query: FilterOptions,
      variables: { filterId: filterIds.priceCH },
    });
    assert.strictEqual(data.filter.optionsAreGenerated, true);
    const values = data.filter.options.map(({ value }) => value);
    for (const value of ['3000', '3900', '4500', '5000', '9000']) assert.ok(values.includes(value));
    assert.ok(!values.includes('5900'));
  });

  test('applies a price edit with the next cache rebuild', async () => {
    await db
      .collection('products')
      .updateOne(
        { _id: 'sf-mini-8', 'commerce.pricing.countryCode': 'CH' },
        { $set: { 'commerce.pricing.$.amount': 5500 } },
      );
    assert.ok((await productIds('CH', 'price_ch', '0:5000')).includes('sf-mini-8'));

    await adminGraphqlFetch({
      query: /* GraphQL */ `
        mutation Rebuild($filterId: ID!) {
          updateFilter(filterId: $filterId, filter: { isActive: true }) {
            _id
          }
        }
      `,
      variables: { filterId: filterIds.priceCH },
    });
    assert.ok(!(await productIds('CH', 'price_ch', '0:5000')).includes('sf-mini-8'));
  });
});
