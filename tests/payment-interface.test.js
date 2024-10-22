import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetch;

describe('PaymentInterface', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
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
      expect(paymentInterfaces.length).not.toBe(0);
      expect(paymentInterfaces).toMatchObject([
        { _id: 'shop.unchained.invoice' },
        { _id: 'shop.unchained.invoice-prepaid' },
      ]);
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
