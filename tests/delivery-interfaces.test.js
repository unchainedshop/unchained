import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;

test.describe('Delivery: Interfaces', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('For logged in users', () => {
    test('should return list of deliveryinterfaces by type', async () => {
      const {
        data: { deliveryInterfaces },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryInterfaces($type: DeliveryProviderType!) {
            deliveryInterfaces(type: $type) {
              _id
              label
              version
            }
          }
        `,
        variables: {
          type: 'PICKUP',
        },
      });

      assert.equal(deliveryInterfaces.length, 1);

      assert.partialDeepStrictEqual(deliveryInterfaces[0], {
        _id: 'shop.unchained.stores',
      });
    });
  });

  test.describe('For Anonymous user', () => {
    test('should return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query DeliveryInterfaces($type: DeliveryProviderType!) {
            deliveryInterfaces(type: $type) {
              _id
            }
          }
        `,
        variables: {
          type: 'PICKUP',
        },
      });
      assert.strictEqual(errors[0].extensions.code, 'NoPermissionError');
    });
  });
});
