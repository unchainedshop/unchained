import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { MultiChoiceFilter } from './seeds/filters.js';

let graphqlFetch;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

describe('Filters', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  describe('Query.filters for admin user should', () => {
    it('return list of active filters', async () => {
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
      expect(filters.length).toEqual(0);
    });

    it('Return list of matching search results', async () => {
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

      expect(filters.length).toEqual(1);
      expect(filters).toMatchObject([
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

    it('Return empty array when search is not found', async () => {
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

      expect(filters.length).toEqual(0);
    });

    it('return list of active and in-active filters', async () => {
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
      expect(filters.length).toEqual(1);
      expect(filters).toMatchObject([
        {
          _id: expect.anything(),
          isActive: false,
        },
      ]);
    });
  });

  describe('Query.filtersCount for admin user should', () => {
    it('return total number of active filters', async () => {
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
      expect(filtersCount).toEqual(0);
    });

    it('return total number of active and in-active filters', async () => {
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
      expect(filtersCount).toEqual(1);
    });
  });

  describe('Query.filtersCount for normal user should', () => {
    it('return total number of active filters', async () => {
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
      expect(filtersCount).toEqual(0);
    });
  });

  describe('Query.filtersCount for Anonymous user should', () => {
    it('return total number of active filters', async () => {
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
      expect(filtersCount).toEqual(0);
    });
  });

  describe('Query.filter for admin user should', () => {
    it('return single filter for existing filter id', async () => {
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
      expect(filter).toMatchObject({
        _id: MultiChoiceFilter._id,
        isActive: MultiChoiceFilter.isActive,
        type: MultiChoiceFilter.type,
        key: MultiChoiceFilter.key,
      });
    });

    it('return error when passed invalid filterId', async () => {
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
      expect(filter).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Query.Filters for anonymous user should', () => {
    it('return empty array', async () => {
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
      expect(filters.length).toBe(0);
    });
  });

  describe('mutation.updateFilterTexts for admin user should', () => {
    it('update filter texts successfully when passed valid filter ID', async () => {
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

      expect(updateFilterTexts.length).toEqual(2);
      expect(updateFilterTexts).toMatchObject([
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
      ]);
    });

    it('return not found error when passed non existing filter ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('FilterNotFoundError');
    });

    it('return error when passed  invalid filter ID', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateFilterTexts for anonymous user should', () => {
    it('return error', async () => {
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.createFilter', () => {
    it('create a new single choice filter', async () => {
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

      expect(createFilter).toMatchObject({
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

      expect(searchProducts).toMatchObject({
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

  describe('mutation.updateFilter for admin User', () => {
    it('should update filter successfuly when passed valid filter ID', async () => {
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

      expect(updateFilter).toMatchObject({
        key: '999',
        isActive: true,
      });
    });

    it('return not found error when passed non existing filter ID', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('FilterNotFoundError');
    });

    it('return error when passed invalid filter ID', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateFilter for anonymous User', () => {
    it('return error', async () => {
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.removeFilter for admin User', () => {
    it('should remove filter successfuly when passed valid filter ID', async () => {
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
      expect(filter).toBe(null);
    });

    it('return not found error when passed non existing filter ID', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('FilterNotFoundError');
    });

    it('return error when passed invalid filter ID', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.removeFilter for anonymous User', () => {
    it('return error', async () => {
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
