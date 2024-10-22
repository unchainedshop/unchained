import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { BaseCountry } from './seeds/locale-data.js';

let graphqlFetch;

describe('Country', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('For admin user ', () => {
    it('Return country search result', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($queryString: String) {
            countries(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'CH',
        },
      });
      expect(countries.length).toEqual(1);
      expect(countries).toMatchObject([
        {
          _id: BaseCountry._id,
          isoCode: BaseCountry.isoCode,
        },
      ]);
    });

    it('Return empty array when no matching search result found', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($queryString: String) {
            countries(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      expect(countries.length).toEqual(0);
    });
  });
});
