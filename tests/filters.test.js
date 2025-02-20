import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { MultiChoiceFilter } from './seeds/filters.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

test.describe('Filters', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.filters for admin user should', () => {
    test('return list of active filters', async () => {
      const {
        data: { filters },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Filters($limit: Int = 10, $offset: Int = 0, $includeInactive: Boolean = false) {
            filters(limit: $limit, offset: $offset, includeInactive: $includeInactive) {
              _id
              updated
              created
              isActive
              texts {
                _id
                locale
                title
                subtitle
              }
              type
              key
              key
              options {
                _id
                texts {
                  _id
                  locale
                  title
                  subtitle
                }
                value
              }
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(filters.length, 0);
    });

    test('Return list of matching search results', async () => {
      const {
        data: { filters },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Filters($queryString: String) {
            filters(queryString: $queryString, includeInactive: true) {
              _id
              updated
              created
              isActive
              texts {
                _id
                locale
                title
                subtitle
              }
              type
              key
              key
              options {
                _id
                texts {
                  _id
                  locale
                  title
                  subtitle
                }
                value
              }
            }
          }
        `,
        variables: {
          queryString: 'highlight',
        },
      });

      assert.strictEqual(filters.length, 1);
      assert.deepStrictEqual(filters, [
        {
          _id: 'multichoice-filter',
          updated: '2020-03-16T09:32:31.996Z',
          created: '2020-03-16T09:31:42.690Z',
          isActive: false,
          texts: { _id: 'german', locale: 'de', title: 'Special', subtitle: null },
          type: 'MULTI_CHOICE',
          key: 'tags',
          options: [
            {
              _id: 'multichoice-filter:highlight',
              texts: null,
              value: 'highlight',
            },
            { _id: 'multichoice-filter:tag-1', texts: null, value: 'tag-1' },
            { _id: 'multichoice-filter:tag-2', texts: null, value: 'tag-2' },
          ],
        },
      ]);
    });

    test('Return empty array when search is not found', async () => {
      const {
        data: { filters },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Filters($queryString: String) {
            filters(queryString: $queryString, includeInactive: true) {
              _id
            }
          }
        `,
        variables: {
          queryString: 'non_existing',
        },
      });

      assert.strictEqual(filters.length, 0);
    });

    test('return list of active and in-active filters', async () => {
      const {
        data: { filters },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Filters($limit: Int = 10, $offset: Int = 0, $includeInactive: Boolean = false) {
            filters(limit: $limit, offset: $offset, includeInactive: $includeInactive) {
              _id
              isActive
            }
          }
        `,
        variables: {
          includeInactive: true,
        },
      });
      assert.strictEqual(filters.length, 1);
      assert.partialDeepStrictEqual(filters[0], {
        isActive: false,
      });
    });
  });

  test.describe('Query.filtersCount for admin user should', () => {
    test('return total number of active filters', async () => {
      const {
        data: { filtersCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query FiltersCount($includeInactive: Boolean = false) {
            filtersCount(includeInactive: $includeInactive)
          }
        `,
        variables: {},
      });
      assert.strictEqual(filtersCount, 0);
    });

    test('return total number of active and in-active filters', async () => {
      const {
        data: { filtersCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Filters($includeInactive: Boolean = false) {
            filtersCount(includeInactive: $includeInactive)
          }
        `,
        variables: {
          includeInactive: true,
        },
      });
      assert.strictEqual(filtersCount, 1);
    });
  });

  test.describe('Query.filtersCount for normal user should', () => {
    test('return total number of active filters', async () => {
      const {
        data: { filtersCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query FiltersCount($includeInactive: Boolean = false) {
            filtersCount(includeInactive: $includeInactive)
          }
        `,
        variables: {},
      });
      assert.strictEqual(filtersCount, 0);
    });
  });

  test.describe('Query.filtersCount for Anonymous user should', () => {
    test('return total number of active filters', async () => {
      const {
        data: { filtersCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query FiltersCount($includeInactive: Boolean = false) {
            filtersCount(includeInactive: $includeInactive)
          }
        `,
        variables: {},
      });
      assert.strictEqual(filtersCount, 0);
    });
  });

  test.describe('Query.filter for admin user should', () => {
    test('return single filter for existing filter id', async () => {
      const {
        data: { filter },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Filter($filterId: ID!) {
            filter(filterId: $filterId) {
              _id
              updated
              created
              isActive
              texts {
                _id
                locale
                title
                subtitle
              }
              type
              key
              options {
                _id
                texts {
                  _id
                  locale
                  title
                  subtitle
                }
                value
              }
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
        },
      });
      assert.partialDeepStrictEqual(filter, {
        _id: MultiChoiceFilter._id,
        isActive: MultiChoiceFilter.isActive,
        type: MultiChoiceFilter.type,
        key: MultiChoiceFilter.key,
      });
    });

    test('return error when passed invalid filterId', async () => {
      const {
        data: { filter },
        errors,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Filter($filterId: ID!) {
            filter(filterId: $filterId) {
              _id
            }
          }
        `,
        variables: {
          filterId: '',
        },
      });
      assert.strictEqual(filter, null);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Query.Filters for anonymous user should', () => {
    test('return empty array', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const {
        data: { filters },
      } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query Filters($limit: Int = 10, $offset: Int = 0, $includeInactive: Boolean = false) {
            filters(limit: $limit, offset: $offset, includeInactive: $includeInactive) {
              _id
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(filters.length, 0);
    });
  });

  test.describe('mutation.updateFilterTexts for admin user should', () => {
    test('update filter texts successfully when passed valid filter ID', async () => {
      const {
        data: { updateFilterTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
            $texts: [FilterTextInput!]!
          ) {
            updateFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
              texts: $texts
            ) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
          filterOptionValue: 'Hello world',
          texts: [
            {
              locale: 'en',
              title: 'english-filter-text',
              subtitle: 'english-filter-text-subtitle',
            },
            {
              locale: 'am',
              title: 'amharic-filter-text',
              subtitle: 'amharic-filter-text-subtitle',
            },
          ],
        },
      });

      assert.strictEqual(updateFilterTexts.length, 2);
      assert.partialDeepStrictEqual(updateFilterTexts[0], {
        locale: 'en',
        title: 'english-filter-text',
        subtitle: 'english-filter-text-subtitle',
      });
      assert.partialDeepStrictEqual(updateFilterTexts[1], {
        locale: 'am',
        title: 'amharic-filter-text',
        subtitle: 'amharic-filter-text-subtitle',
      });
    });

    test('return not found error when passed non existing filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
            $texts: [FilterTextInput!]!
          ) {
            updateFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
              texts: $texts
            ) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'invalid-id',
          filterOptionValue: 'Hello world',
          texts: [
            {
              locale: 'en',
              title: 'english-filter-text',
              subtitle: 'english-filter-text-subtitle',
            },
          ],
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'FilterNotFoundError');
    });

    test('return error when passed  invalid filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
            $texts: [FilterTextInput!]!
          ) {
            updateFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
              texts: $texts
            ) {
              _id
            }
          }
        `,
        variables: {
          filterId: '',
          filterOptionValue: 'Hello world',
          texts: [
            {
              locale: 'en',
              title: 'english-filter-text',
              subtitle: 'english-filter-text-subtitle',
            },
          ],
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateFilterTexts for anonymous user should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
            $texts: [FilterTextInput!]!
          ) {
            updateFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
              texts: $texts
            ) {
              _id
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
          filterOptionValue: 'Hello world',
          texts: [
            {
              locale: 'en',
              title: 'english-filter-text',
              subtitle: 'english-filter-text-subtitle',
            },
          ],
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.createFilter', () => {
    test('create a new single choice filter', async () => {
      const { data: { createFilter } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createFilter($filter: CreateFilterInput!, $texts: [FilterTextInput!]) {
            createFilter(filter: $filter, texts: $texts) {
              _id
              isActive
              texts {
                title
              }
              type
              key
              options {
                _id
                texts {
                  _id
                  title
                  subtitle
                }
                value
              }
            }
          }
        `,
        variables: {
          filter: {
            key: 'warehousing.baseUnit',
            type: 'SINGLE_CHOICE',
            options: ['ST'],
          },
          texts: [{ title: 'Mengeneinheit Filter', locale: 'de' }],
        },
      });

      assert.partialDeepStrictEqual(createFilter, {
        isActive: false,
        texts: {
          title: 'Mengeneinheit Filter',
        },
        type: 'SINGLE_CHOICE',
        key: 'warehousing.baseUnit',
        options: [
          {
            texts: null,
            value: 'ST',
          },
        ],
      });

      const { data: { searchProducts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query searchProducts($queryString: String, $filterQuery: [FilterQueryInput!]) {
            searchProducts(
              queryString: $queryString
              filterQuery: $filterQuery
              includeInactive: true
              ignoreChildAssortments: false
            ) {
              productsCount
              filters {
                filteredProductsCount
                definition {
                  _id
                  key
                }
                options {
                  isSelected
                  filteredProductsCount
                  definition {
                    _id
                    value
                  }
                }
              }
            }
          }
        `,
        variables: {
          queryString: 'product',
          filterQuery: null,
        },
      });

      assert.partialDeepStrictEqual(searchProducts, {
        productsCount: 1,
        filters: [
          {
            definition: {
              key: 'tags',
            },
          },
          {
            filteredProductsCount: 1,
            definition: {
              key: 'warehousing.baseUnit',
            },
          },
        ],
      });
    });
  });

  test.describe('mutation.updateFilter for admin User', () => {
    test('should update filter successfuly when passed valid filter ID', async () => {
      const { data: { updateFilter } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateFilter($filter: UpdateFilterInput!, $filterId: ID!) {
            updateFilter(filter: $filter, filterId: $filterId) {
              _id
              updated
              created
              isActive
              texts {
                _id
                locale
                title
                subtitle
              }
              type
              key
              options {
                _id
                value
                texts {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
          filter: {
            isActive: true,
            key: '999',
          },
        },
      });

      assert.partialDeepStrictEqual(updateFilter, {
        key: '999',
        isActive: true,
      });
    });

    test('return not found error when passed non existing filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateFilter($filter: UpdateFilterInput!, $filterId: ID!) {
            updateFilter(filter: $filter, filterId: $filterId) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'non-existing-id',
          filter: {
            isActive: true,
            key: '999',
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'FilterNotFoundError');
    });

    test('return error when passed invalid filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateFilter($filter: UpdateFilterInput!, $filterId: ID!) {
            updateFilter(filter: $filter, filterId: $filterId) {
              _id
            }
          }
        `,
        variables: {
          filterId: '',
          filter: {
            isActive: true,
            key: '999',
          },
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateFilter for anonymous User', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateFilter($filter: UpdateFilterInput!, $filterId: ID!) {
            updateFilter(filter: $filter, filterId: $filterId) {
              _id
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
          filter: {
            isActive: true,
            key: '999',
          },
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeFilter for admin User', () => {
    test('should remove filter successfuly when passed valid filter ID', async () => {
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveFilter($filterId: ID!) {
            removeFilter(filterId: $filterId) {
              _id
              updated
              created
              isActive
              texts {
                _id
                locale
                title
                subtitle
              }
              type
              key
              options {
                _id
                value
                texts {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
        },
      });

      const {
        data: { filter },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Filter($filterId: ID!) {
            filter(filterId: $filterId) {
              _id
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
        },
      });
      assert.strictEqual(filter, null);
    });

    test('return not found error when passed non existing filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveFilter($filterId: ID!) {
            removeFilter(filterId: $filterId) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'non-existing-id',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'FilterNotFoundError');
    });

    test('return error when passed invalid filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveFilter($filterId: ID!) {
            removeFilter(filterId: $filterId) {
              _id
            }
          }
        `,
        variables: {
          filterId: '',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.removeFilter for anonymous User', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveFilter($filterId: ID!) {
            removeFilter(filterId: $filterId) {
              _id
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
