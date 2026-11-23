import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Collection } from 'mongodb';
import { filtersSettings } from '@unchainedshop/core-filters';
import { FilterDirector } from '@unchainedshop/core';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { SimpleProduct } from './seeds/products.js';

// An empty process cache with the production TTL, which holds every loaded filter for the rest of
// the search. Outside production the TTL is 1 ms.
const coldCache = async (db) => {
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await filtersSettings.configureSettings({}, db);
  } finally {
    process.env.NODE_ENV = nodeEnv;
  }
};

test('Mongo groups filter memberships by ID and distinguishes missing and empty maps', async () => {
  const [db] = await setupDatabase();
  await db.collection('filter_productId_cache').insertMany([
    { filterId: 'empty', filterOptionValue: null, productIds: [] },
    { filterId: 'legacy', filterOptionValue: '__proto__', productIds: ['p2', 'p1'] },
  ]);
  const read = (id) => filtersSettings.getCachedProductIds(id);
  const [missing, legacy, empty, duplicate] = await Promise.all(
    ['missing', 'legacy', 'empty', 'legacy'].map(read),
  );
  assert.equal(missing, null);
  assert.deepEqual(empty, [[], {}]);
  assert.deepEqual(legacy, [[], { ['__proto__']: ['p2', 'p1'] }]);
  assert.deepEqual(duplicate, legacy);
});

test('a cold search reads the memberships of all its filters in one query', async (t) => {
  const [db] = await setupDatabase();
  const originalSettings = { ...filtersSettings };
  t.after(() => filtersSettings.configureSettings(originalSettings, db));
  const ids = Array.from({ length: 97 }, (_, i) => `facet-${i}`);
  const products = [SimpleProduct._id];
  await db.collection('filters').insertMany(
    ids.map((_id) => ({
      _id,
      key: _id,
      type: 'MULTI_CHOICE',
      options: ['yes'],
      isActive: true,
      created: new Date(0),
    })),
  );
  await db.collection('filter_productId_cache').insertMany(
    ids.flatMap((filterId) => [
      { _id: `${filterId}:`, filterId, filterOptionValue: null, productIds: products },
      { _id: `${filterId}:yes`, filterId, filterOptionValue: 'yes', productIds: products },
    ]),
  );

  const batches = [];
  const find = Collection.prototype.find;
  t.mock.method(Collection.prototype, 'find', function (selector, ...args) {
    if (this.collectionName === 'filter_productId_cache') batches.push(selector.filterId.$in);
    return find.call(this, selector, ...args);
  });
  const reset = async () => {
    await coldCache(db);
    batches.length = 0;
  };
  const graphql = createLoggedInGraphqlFetch();
  const search = async (selected, facets = true) => {
    const { data, errors } = await graphql({
      query: `query Search($picks: [FilterQueryInput!], $facets: Boolean!) {
        searchProducts(queryString: "product", filterQuery: $picks) {
          products { _id }
          filters @include(if: $facets) {
            definition { _id } filteredProductsCount isSelected
            options { definition { value } filteredProductsCount isSelected }
          }
        }
      }`,
      variables: { picks: selected.map((key) => ({ key, value: 'yes' })), facets },
    });
    assert.equal(errors, undefined);
    return data.searchProducts;
  };
  const batchSets = () => batches.map((batch) => new Set(batch));

  await reset();
  await search([], false);
  assert.deepEqual(batches, []);

  await reset();
  const first = await search([]);
  assert.deepEqual(batchSets(), [new Set(ids)]);
  assert.equal(first.filters.length, 97);
  assert.ok(first.products.some(({ _id }) => _id === SimpleProduct._id));
  for (const facet of first.filters) {
    assert.equal(facet.filteredProductsCount, 1);
    assert.deepEqual(facet.options, [
      { definition: { value: 'yes' }, filteredProductsCount: 1, isSelected: false },
    ]);
  }

  // Selected filters narrow the hits first, the remaining facets follow in a second query.
  await reset();
  const picked = ids.slice(0, 2);
  const second = await search(picked);
  assert.deepEqual(batchSets(), [new Set(picked), new Set(ids.slice(2))]);
  assert.deepEqual(second.products, [{ _id: SimpleProduct._id }]);
  assert.deepEqual(
    new Set(second.filters.filter((f) => f.isSelected).map((f) => f.definition._id)),
    new Set(picked),
  );
  for (const facet of second.filters) {
    assert.deepEqual(facet.options, [
      { definition: { value: 'yes' }, filteredProductsCount: 1, isSelected: facet.isSelected },
    ]);
  }

  // A write evicts its filter, and the next search reads only that one again.
  batches.length = 0;
  await filtersSettings.setCachedProductIds(ids[0], [], {}, 1);
  const afterWrite = await search([]);
  assert.deepEqual(batches, [[ids[0]]]);
  const changed = afterWrite.filters.find((f) => f.definition._id === ids[0]);
  assert.equal(changed.filteredProductsCount, 0);
  assert.deepEqual(changed.options, []);
});

test('a failed read is retried instead of remembered', async (t) => {
  const [db] = await setupDatabase();
  const originalSettings = { ...filtersSettings };
  t.after(() => filtersSettings.configureSettings(originalSettings, db));
  await db.collection('filters').insertOne({
    _id: 'retried',
    key: 'retried',
    type: 'MULTI_CHOICE',
    options: ['yes'],
    isActive: true,
    created: new Date(0),
  });
  await coldCache(db);
  await filtersSettings.setCachedProductIds('retried', ['p1'], { yes: ['p1'] }, 1);
  const filter = await db.collection('filters').findOne({ _id: 'retried' });
  const read = async () => [
    ...(await FilterDirector.filterProductIds(
      filter,
      { values: ['yes'] },
      getTestPlatform().unchainedAPI,
    )),
  ];

  const find = Collection.prototype.find;
  const outage = t.mock.method(Collection.prototype, 'find', function (...args) {
    if (this.collectionName === 'filter_productId_cache') throw new Error('database unavailable');
    return find.apply(this, args);
  });
  await assert.rejects(read(), /database unavailable/);
  outage.mock.restore();
  assert.deepEqual(await read(), ['p1']);
});
