import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { BaseLanguage } from './seeds/locale-data.js';

let graphqlFetch;

describe('Language', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('For admin user ', () => {
    it('Return language search result', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($queryString: String) {
            languages(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'de',
        },
      });
      expect(languages.length).toEqual(1);
      expect(languages).toMatchObject([
        {
          _id: BaseLanguage._id,
          isoCode: BaseLanguage.isoCode,
        },
      ]);
    });

    it('Return empty array when no matching search result found', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($queryString: String) {
            languages(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      expect(languages.length).toEqual(0);
    });
  });
});
