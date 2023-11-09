import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { MultiChoiceFilter } from './seeds/filters.js';

let graphqlFetch;

describe('TranslatedFilterTexts', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('Query.translatedFilterTexts for admin user should', () => {
    it('return array of translatedFilterTexts text when existing id is passed', async () => {
      const {
        data: { translatedFilterTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
          ) {
            translatedFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
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
        },
      });
      expect(translatedFilterTexts.length).toEqual(2);
      expect(translatedFilterTexts).toMatchObject([
        { _id: 'german', locale: 'de', title: 'Special', subtitle: null },
        { _id: 'french', locale: 'fr', title: null, subtitle: null }
      ]);
    });

    it('return empty array for non-existing id is passed', async () => {
      const {
        data: { translatedFilterTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
          ) {
            translatedFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
            ) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'non-existing-id',
        },
      });

      expect(translatedFilterTexts.length).toEqual(0);
    });
  });

  describe('Query.TranslatedFilterTexts for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
          ) {
            translatedFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
            ) {
              _id
            }
          }
        `,
        variables: {
          filterId: 'non-existing-id',
        },
      });
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
