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

const seedFilter = async (options) => {
  await db.collection('filters').deleteOne({ _id: FILTER_ID });
  await db.collection('filter_productId_cache').deleteMany({ filterId: FILTER_ID });
  await db.collection('filters').insertOne({
    _id: FILTER_ID,
    key: 'regression-721-tags',
    type: 'MULTI_CHOICE',
    isActive: true,
    options,
    created: new Date(),
  });
};

// Replaces the catalog scan for the duration of one invalidation, so a race that would otherwise
// need a slow catalog can be staged deterministically.
const withStubbedBuild = async (buildProductIdMap, run) => {
  const original = FilterDirector.buildProductIdMap;
  FilterDirector.buildProductIdMap = buildProductIdMap;
  try {
    return await run();
  } finally {
    FilterDirector.buildProductIdMap = original;
  }
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
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], {
      offerable: ['p1'],
      occasion: ['p2'],
    });
    assert.deepStrictEqual(await cacheRowIds(), [
      `${FILTER_ID}:`,
      `${FILTER_ID}:occasion`,
      `${FILTER_ID}:offerable`,
    ]);

    // `occasion` gets retired, so the next invalidation no longer carries it
    await db.collection('filters').updateOne({ _id: FILTER_ID }, { $set: { options: ['offerable'] } });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1'], { offerable: ['p1'] });

    assert.deepStrictEqual(await cacheRowIds(), [`${FILTER_ID}:`, `${FILTER_ID}:offerable`]);
  });

  test('stops resolving a retired option value instead of returning its frozen product ids', async () => {
    await seedFilter(['offerable', 'occasion']);
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], {
      offerable: ['p1'],
      occasion: ['p2'],
    });
    assert.deepStrictEqual(await resolve('occasion'), ['p2']);

    await db.collection('filters').updateOne({ _id: FILTER_ID }, { $set: { options: ['offerable'] } });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1'], { offerable: ['p1'] });

    assert.deepStrictEqual(await resolve('occasion'), []);
    assert.deepStrictEqual(await resolve('offerable'), ['p1']);
  });

  test('discards an invalidation that a concurrent option change superseded', async () => {
    await seedFilter(['a', 'b']);
    const snapshot = await db.collection('filters').findOne({ _id: FILTER_ID });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], { a: ['p1'], b: ['p2'] });

    // Stands in for a build slow enough that the option set moves underneath it: `c` is added
    // and invalidated on its own while this one is still scanning, so what it returns describes
    // a filter that no longer exists. Writing it would retire `c` again.
    await withStubbedBuild(
      async () => {
        await db.collection('filters').updateOne({ _id: FILTER_ID }, { $push: { options: 'c' } });
        await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2', 'p3'], {
          a: ['p1'],
          b: ['p2'],
          c: ['p3'],
        });
        return [['p1', 'p2'], { a: ['p1'], b: ['p2'] }];
      },
      () => FilterDirector.invalidateProductIdCache(snapshot, getTestPlatform().unchainedAPI),
    );

    assert.deepStrictEqual(await cacheRowIds(), [
      `${FILTER_ID}:`,
      `${FILTER_ID}:a`,
      `${FILTER_ID}:b`,
      `${FILTER_ID}:c`,
    ]);
    assert.deepStrictEqual(await resolve('c'), ['p3']);
  });

  test('drops every cache row of a deleted filter, including a late invalidation', async () => {
    await seedFilter(['a', 'b']);
    const snapshot = await db.collection('filters').findOne({ _id: FILTER_ID });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], { a: ['p1'], b: ['p2'] });
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

    // An invalidation that was already in flight when the filter got deleted must not put the
    // rows back.
    await withStubbedBuild(
      async () => [['p1', 'p2'], { a: ['p1'], b: ['p2'] }],
      () => FilterDirector.invalidateProductIdCache(snapshot, getTestPlatform().unchainedAPI),
    );
    assert.deepStrictEqual(await cacheRowIds(), []);
  });

  test('prunes through the removeFilterOption mutation', async () => {
    await seedFilter(['keep', 'retire']);
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], {
      keep: ['p1'],
      retire: ['p2'],
    });

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
