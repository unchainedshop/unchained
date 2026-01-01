import { test, before, describe } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

let graphqlFetch;

describe('Warehousing: Interfaces', () => {
  before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
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
      assert.equal(warehousingInterfaces.length, 1);
      assert.partialDeepStrictEqual(warehousingInterfaces[0], {
        _id: 'shop.unchained.warehousing.store',
        label: 'Store',
      });
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
