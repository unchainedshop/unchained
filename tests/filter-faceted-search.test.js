import assert from 'node:assert';
import test from 'node:test';
import { filtersSettings } from '@unchainedshop/core-filters';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers.js';
import { ConfigurableProduct, PlanProduct, SimpleProduct } from './seeds/products.js';

const [A, B, C] = [SimpleProduct._id, ConfigurableProduct._id, PlanProduct._id];
const ASSORTMENT_ID = 'facet-assortment';

// Values of one filter widen the selection, separate filters narrow it, and each facet counts the
// products left by the other filters.
test.describe('Filter: faceted search on cached memberships', () => {
  let graphqlFetch;

  test.before(async () => {
    const [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
    const filterIds = ['facet-brand', 'facet-color'];
    await db.collection('filters').insertMany(
      [
        ['nike', 'adidas', 'puma'],
        ['red', 'blue'],
      ].map((options, index) => ({
        _id: filterIds[index],
        key: filterIds[index],
        type: 'MULTI_CHOICE',
        options,
        isActive: true,
        created: new Date(0),
      })),
    );
    await filtersSettings.setCachedProductIds(
      'facet-brand',
      [A, B, C],
      { nike: [A, C], adidas: [B], puma: [] },
      1,
    );
    await filtersSettings.setCachedProductIds('facet-color', [A, B, C], { red: [A, B], blue: [C] }, 1);

    // An assortment presets its filters, so they stay facets whatever the selection.
    await db.collection('assortments').insertOne({
      _id: ASSORTMENT_ID,
      isActive: true,
      isRoot: true,
      sequence: 0,
      slugs: [ASSORTMENT_ID],
      created: new Date(0),
    });
    await db.collection('assortment_products').insertMany(
      [A, B, C].map((productId, sortKey) => ({
        _id: `${ASSORTMENT_ID}:${productId}`,
        assortmentId: ASSORTMENT_ID,
        productId,
        sortKey,
      })),
    );
    await db.collection('assortment_filters').insertMany(
      filterIds.map((filterId, sortKey) => ({
        _id: `${ASSORTMENT_ID}:${filterId}`,
        assortmentId: ASSORTMENT_ID,
        filterId,
        sortKey,
      })),
    );
  });

  const search = async (selection, assortmentId) => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        query FacetedSearch($filterQuery: [FilterQueryInput!], $assortmentId: ID) {
          searchProducts(
            filterQuery: $filterQuery
            assortmentId: $assortmentId
            ignoreChildAssortments: true
          ) {
            filteredProductsCount
            products {
              _id
            }
            filters {
              definition {
                key
              }
              isSelected
              productsCount
              filteredProductsCount
              options {
                definition {
                  value
                }
                isSelected
                filteredProductsCount
              }
            }
          }
        }
      `,
      variables: {
        assortmentId,
        filterQuery: Object.entries(selection).flatMap(([key, values]) =>
          values.map((value) => ({ key, value })),
        ),
      },
    });
    assert.strictEqual(errors, undefined);
    const { filteredProductsCount, products, filters } = data.searchProducts;
    const facet = (key) => {
      const loaded = filters.find(({ definition }) => definition.key === key);
      if (!loaded) return undefined;
      return {
        isSelected: loaded.isSelected,
        productsCount: loaded.productsCount,
        count: loaded.filteredProductsCount,
        options: loaded.options.map((option) => [
          option.definition.value,
          option.filteredProductsCount,
          option.isSelected,
        ]),
      };
    };
    return {
      count: filteredProductsCount,
      products: products.map(({ _id }) => _id).sort(),
      brand: facet('facet-brand'),
      color: facet('facet-color'),
    };
  };

  test.describe('with the facets of the selected filters', () => {
    test('without a selection, every option counts its own products', async () => {
      const { brand, color } = await search({});
      assert.deepStrictEqual(brand, {
        isSelected: false,
        productsCount: 3,
        count: 3,
        options: [
          ['nike', 2, false],
          ['adidas', 1, false],
        ],
      });
      assert.deepStrictEqual(color, {
        isSelected: false,
        productsCount: 3,
        count: 3,
        options: [
          ['red', 2, false],
          ['blue', 1, false],
        ],
      });
    });

    test('one value narrows the products', async () => {
      assert.deepStrictEqual(await search({ 'facet-brand': ['nike'] }), {
        count: 2,
        products: [A, C].sort(),
        brand: {
          isSelected: true,
          productsCount: 3,
          count: 2,
          options: [
            ['nike', 2, true],
            ['adidas', 1, false],
          ],
        },
        color: undefined,
      });
    });

    test('values of the same filter add up', async () => {
      const result = await search({ 'facet-brand': ['nike', 'adidas'] });
      assert.strictEqual(result.count, 3);
      assert.deepStrictEqual(result.products, [A, B, C].sort());
      assert.deepStrictEqual(result.brand.options, [
        ['nike', 2, true],
        ['adidas', 1, true],
      ]);
    });

    test('separate filters intersect', async () => {
      assert.deepStrictEqual(await search({ 'facet-brand': ['nike'], 'facet-color': ['red'] }), {
        count: 1,
        products: [A],
        brand: {
          isSelected: true,
          productsCount: 3,
          count: 1,
          options: [
            ['nike', 1, true],
            ['adidas', 1, false],
          ],
        },
        color: {
          isSelected: true,
          productsCount: 3,
          count: 1,
          options: [
            ['red', 1, true],
            ['blue', 1, false],
          ],
        },
      });
    });

    test('a value without products matches nothing but stays selected', async () => {
      assert.deepStrictEqual(await search({ 'facet-brand': ['puma'] }), {
        count: 0,
        products: [],
        brand: {
          isSelected: true,
          productsCount: 3,
          count: 0,
          options: [
            ['nike', 2, false],
            ['adidas', 1, false],
            ['puma', 0, true],
          ],
        },
        color: undefined,
      });
    });
  });

  test.describe('with preset filters', () => {
    test('an unselected facet counts what the other selections leave', async () => {
      assert.deepStrictEqual(await search({ 'facet-brand': ['nike'] }, ASSORTMENT_ID), {
        count: 2,
        products: [A, C].sort(),
        brand: {
          isSelected: true,
          productsCount: 3,
          count: 2,
          options: [
            ['nike', 2, true],
            ['adidas', 1, false],
          ],
        },
        color: {
          isSelected: false,
          productsCount: 3,
          count: 2,
          options: [
            ['red', 1, false],
            ['blue', 1, false],
          ],
        },
      });
    });

    test('an unselected facet is empty when the other selections leave nothing', async () => {
      const { count, color } = await search({ 'facet-brand': ['puma'] }, ASSORTMENT_ID);
      assert.strictEqual(count, 0);
      assert.deepStrictEqual(color, { isSelected: false, productsCount: 3, count: 0, options: [] });
    });
  });
});
