import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { BaseCurrency } from './seeds/locale-data.js';

let graphqlFetch;

describe('Currency', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('For admin user ', () => {
    it('Return currency search result', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($queryString: String) {
            currencies(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'CHF',
        },
      });
      expect(currencies.length).toEqual(1);
      expect(currencies).toMatchObject([
        {
          _id: BaseCurrency._id,
          isoCode: BaseCurrency.isoCode,
        },
      ]);
    });

    it('Return empty array when no matching search result found', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($queryString: String) {
            currencies(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      expect(currencies.length).toEqual(0);
    });
  });
});
