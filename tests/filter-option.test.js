import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { MultiChoiceFilter } from './seeds/filters.js';
import assert from 'node:assert';
import test from 'node:test';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

let graphqlFetch;

test.describe('Filter: Option', () => {
  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.createFilterOption for admin users should', () => {
    test('create filter option successfuly when passed valid filter ID', async () => {
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
      assert.partialDeepStrictEqual(createFilterOption.options[createFilterOption.options.length - 1], {
        _id: 'multichoice-filter:test-filter-option',
        value: 'test-filter-option',
        texts: {
          title: 'test-filter-option-title',
        },
      });
    });

    test('return not found error when passed non existing filterId', async () => {
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
      assert.strictEqual(errors[0].extensions?.code, 'FilterNotFoundError');
    });

    test('return error when passed invalid filterId', async () => {
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
      assert.strictEqual(errors[0].extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.createFilterOption for anonymous users should', () => {
    test('return error', async () => {
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
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeFilterOption for admin users should', () => {
    test('remove filter option successfuly when passed valid filter ID', async () => {
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
      assert.strictEqual(removeFilterOption.options.length, 3);
      assert.strictEqual(
        removeFilterOption.options.filter((o) => o.value === 'test-filter-option').length,
        0,
      );
    });

    test('return not found error when passed non existing filter ID', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'FilterNotFoundError');
    });

    test('return error when passed invalid filter ID', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.removeFilterOption for anonymous users should', () => {
    test('return error when passed valid filter ID', async () => {
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
      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
