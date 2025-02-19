import { test } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { MultiChoiceFilter } from './seeds/filters.js';

let graphqlFetch;

test.describe('TranslatedFilterTexts', async () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.describe('Query.translatedFilterTexts for admin user should', async () => {
    test('return array of translatedFilterTexts text when existing id is passed', async () => {
      const {
        data: { translatedFilterTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts($filterId: ID!, $filterOptionValue: String) {
            translatedFilterTexts(filterId: $filterId, filterOptionValue: $filterOptionValue) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
        },
      });
      assert.equal(translatedFilterTexts.length, 2);
      assert.deepStrictEqual(translatedFilterTexts, [
        { _id: 'german', locale: 'de', title: 'Special', subtitle: null },
        { _id: 'french', locale: 'fr', title: null, subtitle: null },
      ]);
    });

    test('return empty array for non-existing id is passed', async () => {
      const {
        data: { translatedFilterTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts($filterId: ID!, $filterOptionValue: String) {
            translatedFilterTexts(filterId: $filterId, filterOptionValue: $filterOptionValue) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'non-existing-id',
        },
      });

      assert.equal(translatedFilterTexts.length, 0);
    });
  });

  test.describe('Query.TranslatedFilterTexts for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts($filterId: ID!, $filterOptionValue: String) {
            translatedFilterTexts(filterId: $filterId, filterOptionValue: $filterOptionValue) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'non-existing-id',
        },
      });
      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
