import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
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

// Records whether each read on the cache collection fetched product ids or only row hashes.
const recordReads = (t) => {
  const reads = [];
  const find = Collection.prototype.find;
  t.mock.method(Collection.prototype, 'find', function (selector, options, ...rest) {
    if (this.collectionName === 'filter_productId_cache') {
      reads.push(options?.projection?.productIds ? 'productIds' : 'hashes');
    }
    return find.call(this, selector, options, ...rest);
  });
  return reads;
};

// Outside production the memo expires after 1 ms, so each read below starts after an expiry.
const readExpired = async (filterId) => {
  await setTimeout(5);
  return filtersSettings.getCachedProductIds(filterId);
};

test('an expired filter is checked by its hashes and read again only after a change', async (t) => {
  const [db] = await setupDatabase();
  const originalSettings = { ...filtersSettings };
  t.after(() => filtersSettings.configureSettings(originalSettings, db));
  await filtersSettings.configureSettings({}, db);
  await filtersSettings.setCachedProductIds('revalidated', ['p1', 'p2'], { yes: ['p1'], no: ['p2'] }, 1);
  const reads = recordReads(t);

  const first = await readExpired('revalidated');
  const second = await readExpired('revalidated');
  assert.deepEqual(reads, ['productIds', 'hashes']);
  assert.equal(second[0], first[0]);
  assert.deepEqual(second, [['p1', 'p2'], { yes: ['p1'], no: ['p2'] }]);

  reads.length = 0;
  await filtersSettings.setCachedProductIds('revalidated', ['p1'], { yes: ['p1'] }, 2);
  assert.deepEqual(await readExpired('revalidated'), [['p1'], { yes: ['p1'] }]);
  assert.deepEqual(reads, ['hashes', 'productIds']);

  reads.length = 0;
  await filtersSettings.purgeCachedProductIds('revalidated');
  assert.equal(await readExpired('revalidated'), null);
  assert.deepEqual(reads, ['productIds']);
});

test('rows without a hash are read completely on every expiry', async (t) => {
  const [db] = await setupDatabase();
  const originalSettings = { ...filtersSettings };
  t.after(() => filtersSettings.configureSettings(originalSettings, db));
  await filtersSettings.configureSettings({}, db);
  await db.collection('filter_productId_cache').insertMany([
    { filterId: 'unhashed', filterOptionValue: null, productIds: ['p1'] },
    { filterId: 'unhashed', filterOptionValue: 'yes', productIds: ['p1'] },
  ]);
  const reads = recordReads(t);

  for (let i = 0; i < 2; i += 1) {
    assert.deepEqual(await readExpired('unhashed'), [['p1'], { yes: ['p1'] }]);
  }
  assert.deepEqual(reads, ['productIds', 'productIds']);
});

// Lets the first read of the given kind fetch its rows and holds them back until release().
const holdRead = (t, kind) => {
  const fetched = Promise.withResolvers();
  const released = Promise.withResolvers();
  let holding = false;
  const find = Collection.prototype.find;
  t.mock.method(Collection.prototype, 'find', function (selector, options, ...rest) {
    const cursor = find.call(this, selector, options, ...rest);
    const reads = options?.projection?.productIds ? 'productIds' : 'hashes';
    if (!holding && this.collectionName === 'filter_productId_cache' && reads === kind) {
      holding = true;
      const toArray = cursor.toArray.bind(cursor);
      cursor.toArray = async () => {
        const rows = await toArray();
        fetched.resolve();
        await released.promise;
        return rows;
      };
    }
    return cursor;
  });
  return { fetched: fetched.promise, release: released.resolve };
};

// Reads `batch` after the memo expired and purges the filter `purged` while the read of the given
// kind is in flight, after it fetched its rows. `purged` and `kept` were read before, `fresh` not.
const purgeDuringRead = async (t, kind, batch) => {
  const [db] = await setupDatabase();
  const originalSettings = { ...filtersSettings };
  t.after(() => filtersSettings.configureSettings(originalSettings, db));
  await filtersSettings.configureSettings({}, db);
  for (const filterId of ['purged', 'kept', 'fresh']) {
    await filtersSettings.setCachedProductIds(filterId, [filterId], { yes: [filterId] }, 1);
  }
  await filtersSettings.getCachedProductIds('purged');
  await filtersSettings.getCachedProductIds('kept');
  await setTimeout(5);

  const { fetched, release } = holdRead(t, kind);
  const reads = Promise.all(batch.map((filterId) => filtersSettings.getCachedProductIds(filterId)));
  await fetched;
  await filtersSettings.purgeCachedProductIds('purged');
  release();
  return reads;
};

// The batch started before the purge, so it answers with the rows it found. The next read finds none.
test('a purge while a batch compares hashes fails none of its reads', async (t) => {
  assert.deepEqual(await purgeDuringRead(t, 'hashes', ['purged', 'kept']), [
    [['purged'], { yes: ['purged'] }],
    [['kept'], { yes: ['kept'] }],
  ]);
  assert.equal(await readExpired('purged'), null);
});

test('a purge while a batch reads product ids fails none of its reads', async (t) => {
  assert.deepEqual(await purgeDuringRead(t, 'productIds', ['purged', 'fresh']), [
    [['purged'], { yes: ['purged'] }],
    [['fresh'], { yes: ['fresh'] }],
  ]);
  assert.equal(await readExpired('purged'), null);
});
