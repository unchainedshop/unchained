import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { filtersSettings } from '@unchainedshop/core-filters';
import { FilterDirector } from '@unchainedshop/core';
import assert from 'node:assert';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';

let db;
let graphqlFetch;

const FILTER_ID = 'regression-721-filter';

const cacheRowIds = async () =>
  (
    await db
      .collection('filter_productId_cache')
      .find({ filterId: FILTER_ID }, { projection: { _id: 1 } })
      .sort({ _id: 1 })
      .toArray()
  ).map(({ _id }) => _id);

const seedFilter = async (options, updated = new Date('2020-01-01')) => {
  await db.collection('filters').deleteOne({ _id: FILTER_ID });
  await db.collection('filter_productId_cache').deleteMany({ filterId: FILTER_ID });
  await db.collection('filters').insertOne({
    _id: FILTER_ID,
    key: 'regression-721-tags',
    type: 'MULTI_CHOICE',
    isActive: true,
    options,
    created: new Date('2019-01-01'),
    updated,
  });
};

// Reads without waiting out the in-process memo, so a missing eviction cannot hide behind a sleep.
const resolveNow = async (value) => {
  const filter = await db.collection('filters').findOne({ _id: FILTER_ID });
  const { unchainedAPI } = getTestPlatform();
  return [...(await FilterDirector.filterProductIds(filter, { values: [value] }, unchainedAPI))];
};

const resolve = async (value) => {
  // Cached reads are memoized in process (1ms TTL outside production, 60s in it). Two reads
  // within the same millisecond both hit that memo, so wait it out - otherwise we assert
  // against a map built before the prune rather than against the prune itself.
  await setTimeout(25);
  const filter = await db.collection('filters').findOne({ _id: FILTER_ID });
  const { unchainedAPI } = getTestPlatform();
  return [...(await FilterDirector.filterProductIds(filter, { values: [value] }, unchainedAPI))];
};

test.describe('Filter: product id cache invalidation', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test('drops the cache row of an option that is no longer part of the filter', async () => {
    await seedFilter(['offerable', 'occasion']);
    await filtersSettings.setCachedProductIds(
      FILTER_ID,
      ['p1', 'p2'],
      { offerable: ['p1'], occasion: ['p2'] },
      1,
    );
    assert.deepStrictEqual(await cacheRowIds(), [
      `${FILTER_ID}:`,
      `${FILTER_ID}:occasion`,
      `${FILTER_ID}:offerable`,
    ]);

    // `occasion` gets retired, so the next invalidation no longer carries it
    await db.collection('filters').updateOne({ _id: FILTER_ID }, { $set: { options: ['offerable'] } });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1'], { offerable: ['p1'] }, 2);

    assert.deepStrictEqual(await cacheRowIds(), [`${FILTER_ID}:`, `${FILTER_ID}:offerable`]);
  });

  test('stops resolving a retired option value instead of returning its frozen product ids', async () => {
    await seedFilter(['offerable', 'occasion']);
    await filtersSettings.setCachedProductIds(
      FILTER_ID,
      ['p1', 'p2'],
      { offerable: ['p1'], occasion: ['p2'] },
      1,
    );
    assert.deepStrictEqual(await resolve('occasion'), ['p2']);

    await db.collection('filters').updateOne({ _id: FILTER_ID }, { $set: { options: ['offerable'] } });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1'], { offerable: ['p1'] }, 2);

    assert.deepStrictEqual(await resolve('occasion'), []);
    assert.deepStrictEqual(await resolve('offerable'), ['p1']);
  });

  test('an overtaken rebuild neither publishes its result nor retires the newer option', async () => {
    const older = new Date('2020-01-01').getTime();
    const newer = new Date('2020-06-01').getTime();
    await seedFilter(['a', 'b']);
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], { a: ['p1'], b: ['p2'] }, older);

    // `c` is added and published by a later generation
    await db.collection('filters').updateOne({ _id: FILTER_ID }, { $push: { options: 'c' } });
    await filtersSettings.setCachedProductIds(
      FILTER_ID,
      ['p1', 'p2', 'p3'],
      { a: ['p1'], b: ['p2'], c: ['p3'] },
      newer,
    );

    // only now does the rebuild that started before it get round to writing
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], { a: ['p1'], b: ['p2'] }, older);

    assert.deepStrictEqual(await cacheRowIds(), [
      `${FILTER_ID}:`,
      `${FILTER_ID}:a`,
      `${FILTER_ID}:b`,
      `${FILTER_ID}:c`,
    ]);
    assert.deepStrictEqual(await resolve('c'), ['p3']);
    const base = await db
      .collection('filter_productId_cache')
      .findOne({ filterId: FILTER_ID, filterOptionValue: null });
    assert.deepStrictEqual([...base.productIds].sort(), ['p1', 'p2', 'p3']);
  });

  test('a key rename is caught even though the option values are unchanged', async () => {
    const older = new Date('2020-01-01').getTime();
    const newer = new Date('2020-06-01').getTime();
    await seedFilter(['a']);
    // the rename bumps the generation, and its rebuild publishes first
    await filtersSettings.setCachedProductIds(
      FILTER_ID,
      ['from-new-key'],
      { a: ['from-new-key'] },
      newer,
    );
    // the rebuild that ran under the old key has the same options but an older generation
    await filtersSettings.setCachedProductIds(
      FILTER_ID,
      ['from-old-key'],
      { a: ['from-old-key'] },
      older,
    );

    const row = await db
      .collection('filter_productId_cache')
      .findOne({ filterId: FILTER_ID, filterOptionValue: 'a' });
    assert.deepStrictEqual(row.productIds, ['from-new-key']);
  });

  test('carries the filter generation through invalidateProductIdCache', async () => {
    await seedFilter(['a'], new Date('2020-06-01'));
    const filter = await db.collection('filters').findOne({ _id: FILTER_ID });
    await FilterDirector.invalidateProductIdCache(filter, getTestPlatform().unchainedAPI);

    const row = await db
      .collection('filter_productId_cache')
      .findOne({ filterId: FILTER_ID, filterOptionValue: null });
    assert.strictEqual(row.computedAt, new Date('2020-06-01').getTime());
  });

  test('drops every cache row of a deleted filter, including a late invalidation', async () => {
    await seedFilter(['a', 'b']);
    const snapshot = await db.collection('filters').findOne({ _id: FILTER_ID });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], { a: ['p1'], b: ['p2'] }, 1);
    assert.strictEqual((await cacheRowIds()).length, 3);

    const { data: { removeFilter } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation RemoveFilter($filterId: ID!) {
          removeFilter(filterId: $filterId) {
            _id
          }
        }
      `,
      variables: { filterId: FILTER_ID },
    });
    assert.strictEqual(removeFilter._id, FILTER_ID);
    assert.deepStrictEqual(await cacheRowIds(), []);

    // An invalidation already in flight when the filter got deleted must not rebuild the cache
    // of something that no longer exists.
    const original = FilterDirector.buildProductIdMap;
    FilterDirector.buildProductIdMap = async () => [['p1', 'p2'], { a: ['p1'], b: ['p2'] }];
    try {
      await FilterDirector.invalidateProductIdCache(snapshot, getTestPlatform().unchainedAPI);
    } finally {
      FilterDirector.buildProductIdMap = original;
    }
    assert.deepStrictEqual(await cacheRowIds(), []);
  });

  test('a retired option stops resolving immediately, without waiting out the memo', async () => {
    await seedFilter(['offerable', 'occasion']);
    await filtersSettings.setCachedProductIds(
      FILTER_ID,
      ['p1', 'p2'],
      { offerable: ['p1'], occasion: ['p2'] },
      1,
    );
    assert.deepStrictEqual(await resolveNow('occasion'), ['p2']);

    await db.collection('filters').updateOne({ _id: FILTER_ID }, { $set: { options: ['offerable'] } });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1'], { offerable: ['p1'] }, 2);

    // No sleep: a write has to evict the memo, or production serves this for a minute.
    assert.deepStrictEqual(await resolveNow('occasion'), []);
    assert.deepStrictEqual(await resolveNow('offerable'), ['p1']);
  });

  test('removes a filter even when purging its cache fails', async () => {
    await seedFilter(['a', 'b']);
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], { a: ['p1'], b: ['p2'] }, 1);

    const purge = filtersSettings.purgeCachedProductIds;
    filtersSettings.purgeCachedProductIds = async () => {
      throw new Error('cache backend unavailable');
    };
    try {
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveFilter($filterId: ID!) {
            removeFilter(filterId: $filterId) {
              _id
            }
          }
        `,
        variables: { filterId: FILTER_ID },
      });
    } finally {
      filtersSettings.purgeCachedProductIds = purge;
    }

    // The canonical record goes even though the derived cache could not be dropped.
    assert.strictEqual(await db.collection('filters').findOne({ _id: FILTER_ID }), null);
  });

  test('treats inherited property names as ordinary option values', async () => {
    // The values come from a user supplied filterQuery, so they can name anything on
    // Object.prototype. Those used to reach the prototype and throw while being iterated.
    await seedFilter(['__proto__', 'regular']);
    // Built through fromEntries on purpose: `{ __proto__: value }` in a literal sets the
    // prototype instead of creating the key, which is the same hazard being tested for.
    await filtersSettings.setCachedProductIds(
      FILTER_ID,
      ['p1', 'p2'],
      Object.fromEntries([
        ['__proto__', ['p1']],
        ['regular', ['p2']],
      ]),
      1,
    );

    assert.deepStrictEqual(await resolve('regular'), ['p2']);
    assert.deepStrictEqual(await resolve('__proto__'), ['p1']);
    for (const inherited of ['constructor', 'toString', 'hasOwnProperty', 'valueOf']) {
      assert.deepStrictEqual(await resolve(inherited), [], `${inherited} should resolve to nothing`);
    }
  });

  test('keeps an option literally named __proto__ when building the map', async () => {
    await seedFilter(['__proto__', 'regular']);
    const filter = await db.collection('filters').findOne({ _id: FILTER_ID });
    const [, productIdsMap] = await FilterDirector.buildProductIdMap(
      filter,
      getTestPlatform().unchainedAPI,
    );
    assert.deepStrictEqual(Object.keys(productIdsMap).sort(), ['__proto__', 'regular']);
  });

  test('prunes through the removeFilterOption mutation', async () => {
    await seedFilter(['keep', 'retire']);
    await filtersSettings.setCachedProductIds(
      FILTER_ID,
      ['p1', 'p2'],
      { keep: ['p1'], retire: ['p2'] },
      1,
    );

    await graphqlFetch({
      query: /* GraphQL */ `
        mutation RemoveFilterOption($filterId: ID!, $filterOptionValue: String!) {
          removeFilterOption(filterId: $filterId, filterOptionValue: $filterOptionValue) {
            _id
          }
        }
      `,
      variables: { filterId: FILTER_ID, filterOptionValue: 'retire' },
    });

    assert.deepStrictEqual(await cacheRowIds(), [`${FILTER_ID}:`, `${FILTER_ID}:keep`]);
    assert.deepStrictEqual(await resolve('retire'), []);
  });
});
