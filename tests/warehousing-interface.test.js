import { test, before, describe } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetch;

describe('WarehousingInterfaces', () => {
  before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('For logged in users', () => {
    test('should return list of warehousingInterfaces by type', async () => {
      const {
        data: { warehousingInterfaces },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query WarehousingInterfaces($type: WarehousingProviderType!) {
            warehousingInterfaces(type: $type) {
              _id
              label
              version
            }
          }
        `,
        variables: {
          type: 'PHYSICAL',
        },
      });
      assert.deepStrictEqual(warehousingInterfaces, [
        {
          _id: 'shop.unchained.warehousing.store',
          label: 'Store',
        },
      ]);
    });
  });

  describe('For Anonymous user', () => {
    test('should return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query WarehousingInterfaces($type: WarehousingProviderType!) {
            warehousingInterfaces(type: $type) {
              _id
            }
          }
        `,
        variables: {
          type: 'PHYSICAL',
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
