import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { MultiChoiceFilter } from './seeds/filters.js';

let graphqlFetch;

describe('FilterOption', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('mutation.createFilterOption for admin users should', () => {
    it('create filter option successfuly when passed valid filter ID', async () => {
      const {
        data: { createFilterOption },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateFilterOption($filterId: ID!, $option: String!, $texts: [FilterTextInput!]) {
            createFilterOption(filterId: $filterId, option: $option, texts: $texts) {
              _id
              updated
              created
              isActive
              texts {
                _id
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
          option: 'test-filter-option',
          texts: [
            {
              title: 'test-filter-option-title',
              locale: 'de',
            },
          ],
        },
      });
      expect(createFilterOption.options[createFilterOption.options.length - 1]).toMatchObject({
        _id: 'multichoice-filter:test-filter-option',
        value: 'test-filter-option',
        texts: {
          title: 'test-filter-option-title',
        },
      });
    });

    it('return not found error when passed non existing filterId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateFilterOption($filterId: ID!, $option: String!, $texts: [FilterTextInput!]) {
            createFilterOption(filterId: $filterId, option: $option, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'invalid-id',
          option: 'test-filter-option',
          texts: [
            {
              title: 'test-filter-option-title',
              locale: 'de',
            },
          ],
        },
      });
      expect(errors[0].extensions?.code).toEqual('FilterNotFoundError');
    });

    it('return error when passed invalid filterId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateFilterOption($filterId: ID!, $option: String!, $texts: [FilterTextInput!]) {
            createFilterOption(filterId: $filterId, option: $option, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          filterId: '',
          option: 'test-filter-option',
          texts: [{ title: 'test-filter-option-title', locale: 'de' }],
        },
      });
      expect(errors[0].extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.createFilterOption for anonymous users should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateFilterOption($filterId: ID!, $option: String!, $texts: [FilterTextInput!]) {
            createFilterOption(filterId: $filterId, option: $option, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
          option: 'test-filter-option',
          texts: [
            {
              title: 'test-filter-option-title',
              locale: 'de',
            },
          ],
        },
      });
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.removeFilterOption for admin users should', () => {
    it('remove filter option successfuly when passed valid filter ID', async () => {
      const {
        data: { removeFilterOption },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveFilterOption($filterId: ID!, $filterOptionValue: String!) {
            removeFilterOption(filterId: $filterId, filterOptionValue: $filterOptionValue) {
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
              }
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
          filterOptionValue: 'test-filter-option',
        },
      });
      expect(removeFilterOption.options.length).toEqual(3);
      expect(removeFilterOption.options.filter((o) => o.value === 'test-filter-option').length).toEqual(
        0,
      );
    });

    it('return not found error when passed non existing filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveFilterOption($filterId: ID!, $filterOptionValue: String!) {
            removeFilterOption(filterId: $filterId, filterOptionValue: $filterOptionValue) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'invalid-filter-id',
          filterOptionValue: 'test-filter-option',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('FilterNotFoundError');
    });

    it('return error when passed invalid filter ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveFilterOption($filterId: ID!, $filterOptionValue: String!) {
            removeFilterOption(filterId: $filterId, filterOptionValue: $filterOptionValue) {
              _id
            }
          }
        `,
        variables: {
          filterId: '',
          filterOptionValue: 'test-filter-option',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.removeFilterOption for anonymous users should', () => {
    it('return error when passed valid filter ID', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveFilterOption($filterId: ID!, $filterOptionValue: String!) {
            removeFilterOption(filterId: $filterId, filterOptionValue: $filterOptionValue) {
              _id
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
          filterOptionValue: 'test-filter-option',
        },
      });
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
