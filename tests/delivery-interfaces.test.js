import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetch;

describe('DeliveryInterfaces', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('For logged in users', () => {
    it('should return list of deliveryinterfaces by type', async () => {
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
      expect(deliveryInterfaces).toMatchObject([
        {
          _id: 'shop.unchained.pick-mup',
        },
        {
          _id: 'shop.unchained.stores',
        },
      ]);
    });
  });

  describe('For Anonymous user', () => {
    it('should return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
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
      expect(errors[0].extensions.code).toEqual('NoPermissionError');
    });
  });
});
