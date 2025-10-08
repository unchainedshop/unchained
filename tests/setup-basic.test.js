import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Setup: Basic Context', () => {
  let graphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('resolved locale context', () => {
    test('user defaults', async () => {
      const {
        data: { me },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            me {
              language {
                isoCode
              }
              country {
                isoCode
              }
            }
          }
        `,
      });
      assert.deepStrictEqual(me, {
        language: {
          isoCode: 'de',
        },
        country: {
          isoCode: 'CH',
        },
      });
    });

    test('global shop context', async () => {
      const {
        data: { shopInfo },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            shopInfo {
              _id
              language {
                isoCode
              }
              country {
                isoCode
                defaultCurrency {
                  isoCode
                }
              }
              version
              userRoles
            }
          }
        `,
      });
      assert.partialDeepStrictEqual(shopInfo, {
        _id: 'root',
        language: {
          isoCode: 'de',
        },
        country: {
          isoCode: 'CH',
          defaultCurrency: {
            isoCode: 'CHF',
          },
        },
        userRoles: ['admin'],
      });
    });
  });
});
