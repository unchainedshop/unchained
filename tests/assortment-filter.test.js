import assert from 'node:assert';
import test from 'node:test';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleAssortment, AssortmentFilters } from './seeds/assortments.js';
import { MultiChoiceFilter } from './seeds/filters.js';

test.describe('AssortmentFilter', () => {
  let graphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.reorderAssortmentFilters for admin users should', () => {
    test('update sortkey value when passed valid assortment filter ID', async () => {
      const result = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentFilters($sortkeys: [ReorderAssortmentFilterInput!]!) {
            reorderAssortmentFilters(sortKeys: $sortkeys) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              filter {
                _id
              }
            }
          }
        `,
        variables: {
          sortkeys: [
            {
              assortmentFilterId: AssortmentFilters[0]._id,
              sortKey: 10,
            },
          ],
        },
      });
      const {
        data: { reorderAssortmentFilters },
      } = result;
      assert.deepStrictEqual(reorderAssortmentFilters[0], {
        _id: AssortmentFilters[0]._id,
        sortKey: 11,
        tags: AssortmentFilters[0].tags,
        assortment: { _id: AssortmentFilters[0].assortmentId },
        filter: { _id: AssortmentFilters[0].filterId },
      });
    });

    test('skip when passed invalid assortment filter ID', async () => {
      const {
        data: { reorderAssortmentFilters },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentFilters($sortkeys: [ReorderAssortmentFilterInput!]!) {
            reorderAssortmentFilters(sortKeys: $sortkeys) {
              _id
            }
          }
        `,
        variables: {
          sortkeys: [
            {
              assortmentFilterId: 'invalid-id',
              sortKey: 10,
            },
          ],
        },
      });

      assert.strictEqual(reorderAssortmentFilters.length, 0);
    });
  });

  test.describe('mutation.reorderAssortmentFilters for anonymous user should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation ReorderAssortmentFilters($sortkeys: [ReorderAssortmentFilterInput!]!) {
            reorderAssortmentFilters(sortKeys: $sortkeys) {
              _id
            }
          }
        `,
        variables: {
          sortkeys: [
            {
              assortmentFilterId: AssortmentFilters[0]._id,
              sortKey: 10,
            },
          ],
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.addAssortmentFilter for admin users should', () => {
    test('Creates assortment filter successfuly when passed a valid assortment and filter IDs', async () => {
      const {
        data: { addAssortmentFilter },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter($assortmentId: ID!, $filterId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentFilter(assortmentId: $assortmentId, filterId: $filterId, tags: $tags) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              filter {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          filterId: MultiChoiceFilter._id,
          tags: ['assortment-filter-1'],
        },
      });

      assert.partialDeepStrictEqual(addAssortmentFilter, {
        tags: ['assortment-filter-1'],
        assortment: { _id: SimpleAssortment[0]._id },
        filter: { _id: MultiChoiceFilter._id },
      });
    });

    test('return error when passed assortment ID that do not exists', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter($assortmentId: ID!, $filterId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentFilter(assortmentId: $assortmentId, filterId: $filterId, tags: $tags) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'invalid-assortment-id',
          filterId: MultiChoiceFilter._id,
          tags: ['assortment-filter-1'],
        },
      });

      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].extensions?.code, 'AssortmentNotFoundError');
    });

    test('return error when passed filter ID that do not exist', async () => {
      const result = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter($assortmentId: ID!, $filterId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentFilter(assortmentId: $assortmentId, filterId: $filterId, tags: $tags) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          filterId: 'invalid-filter-id',
          tags: ['assortment-filter-1'],
        },
      });
      const { errors } = result;
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'FilterNotFoundError');
    });

    test('return error when passed invalid filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter($assortmentId: ID!, $filterId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentFilter(assortmentId: $assortmentId, filterId: $filterId, tags: $tags) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          filterId: '',
          tags: ['assortment-filter-1'],
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('return error when passed invalid assortment ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter($assortmentId: ID!, $filterId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentFilter(assortmentId: $assortmentId, filterId: $filterId, tags: $tags) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: '',
          filterId: MultiChoiceFilter._id,
          tags: ['assortment-filter-1'],
        },
      });

      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.addAssortmentFilter for anonymous users should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentFilter($assortmentId: ID!, $filterId: ID!, $tags: [LowerCaseString!]) {
            addAssortmentFilter(assortmentId: $assortmentId, filterId: $filterId, tags: $tags) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          filterId: MultiChoiceFilter._id,
          tags: ['assortment-filter-1'],
        },
      });

      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeAssortmentFilter for admin users should', () => {
    test('remove assortment filter successfuly when passed valid ID', async () => {
      const {
        // eslint-disable-next-line
        data: { removeAssortmentFilter },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              filter {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentFilterId: AssortmentFilters[0]._id,
        },
      });

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
            }
          }
        `,
        variables: {
          assortmentFilterId: AssortmentFilters[0]._id,
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentFilterNotFoundError');
    });

    test('return not found error when passed non existing assortmentFilterId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
            }
          }
        `,
        variables: {
          assortmentFilterId: 'invalid-id',
        },
      });

      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentFilterNotFoundError');
    });

    test('return error when passed non existing assortmentFilterId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
            }
          }
        `,
        variables: {
          assortmentFilterId: '',
        },
      });

      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.removeAssortmentFilter for anonymous users should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveAssortmentFilter($assortmentFilterId: ID!) {
            removeAssortmentFilter(assortmentFilterId: $assortmentFilterId) {
              _id
              sortKey
              tags
              assortment {
                _id
              }
              filter {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentFilterId: AssortmentFilters[0]._id,
        },
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
