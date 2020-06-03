import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';

let connection;
let graphqlFetch;

describe('PaymentInterface', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('For logged in users', () => {
    it('should return list of paymentInterfaces by type', async () => {
      const {
        data: { paymentInterfaces },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query PaymentInterfaces($type: PaymentProviderType!) {
            paymentInterfaces(type: $type) {
              _id
              label
              version
            }
          }
        `,
        variables: {
          type: 'INVOICE',
        },
      });

      expect(Array.isArray(paymentInterfaces)).toBe(true);
    });
  });

  describe('For Anonymous user', () => {
    it('should return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query PaymentInterfaces($type: PaymentProviderType!) {
            paymentInterfaces(type: $type) {
              _id
            }
          }
        `,
        variables: {
          type: 'INVOICE',
        },
      });

      expect(errors.length).toEqual(1);
    });
  });
});
