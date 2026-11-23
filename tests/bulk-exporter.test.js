import assert from 'node:assert';
import test from 'node:test';
import { setupDatabase, createLoggedInGraphqlFetch, waitForWork } from './helpers.js';

test.describe('Bulk Exporter', () => {
  let db;
  let graphqlFetch;

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  test('exports filters and their options, each with its own texts', async () => {
    await db.collection('filter_texts').insertOne({
      _id: 'german-highlight',
      filterId: 'multichoice-filter',
      filterOptionValue: 'highlight',
      locale: 'de',
      title: 'Hervorgehoben',
    });
    const {
      data: { addWork },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation addWork($input: JSON) {
          addWork(type: BULK_EXPORT, input: $input) {
            _id
          }
        }
      `,
      variables: {
        input: {
          type: 'FILTERS',
          exportFilters: true,
          exportFilterOptions: true,
          includeInactive: true,
        },
      },
    });
    await waitForWork(graphqlFetch, addWork._id);
    const {
      data: { work },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        query work($workId: ID!) {
          work(workId: $workId) {
            result
          }
        }
      `,
      variables: { workId: addWork._id },
    });
    const download = async ({ url }) => (await fetch(url)).text();

    const filters = await download(work.result.files.filters);
    assert.match(filters, /^"multichoice-filter",.*"Special"/m);
    assert.doesNotMatch(filters, /Hervorgehoben/);
    const options = await download(work.result.files.filterOptions);
    assert.match(options, /^"multichoice-filter:highlight",.*"Hervorgehoben"/m);
  }, 30000);
});
