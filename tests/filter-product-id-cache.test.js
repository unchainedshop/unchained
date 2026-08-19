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

  test('keeps an option that was added while a slow invalidation was still in flight', async () => {
    await seedFilter(['a', 'b']);
    // a full invalidation starts here and snapshots [a, b]
    const staleSnapshot = { a: ['p1'], b: ['p2'] };

    // meanwhile `c` gets added and invalidated on its own
    await db.collection('filters').updateOne({ _id: FILTER_ID }, { $push: { options: 'c' } });
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2', 'p3'], {
      a: ['p1'],
      b: ['p2'],
      c: ['p3'],
    });

    // the slow invalidation lands last, carrying an option set that predates `c`
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], staleSnapshot);

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

    // an invalidation that was already in flight when the filter got deleted
    await filtersSettings.setCachedProductIds(FILTER_ID, ['p1', 'p2'], { a: ['p1'], b: ['p2'] });
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
