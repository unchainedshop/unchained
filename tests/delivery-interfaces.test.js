import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';

let connection;
let graphqlFetch;

describe('DeliveryInterfaces', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
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

      expect(Array.isArray(deliveryInterfaces)).toBe(true);
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

      expect(errors.length).toEqual(1);
    });
  });
});
