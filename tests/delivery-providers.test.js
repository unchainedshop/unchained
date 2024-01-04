import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { PickupDeliveryProvider, SendMailDeliveryProvider, SimpleDeliveryProvider } from './seeds/deliveries.js';

let graphqlFetch;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

describe('DeliveryProviders', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = await createAnonymousGraphqlFetch();
  });

  describe('Query.deliveryProviders for admin user should', () => {
    it('return array of all deliveryProviders when type is not given', async () => {
      const {
        data: { deliveryProviders },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProviders {
            deliveryProviders {
              _id
              created
              updated
              deleted
              type
              interface {
                _id
                label
                version
              }
              configuration
              configurationError
              isActive
              simulatedPrice {
                _id
                isTaxable
                isNetPrice
                amount
                currency
              }
            }
          }
        `,
        variables: {},
      });
      expect(deliveryProviders).toMatchObject([
        {
          _id: SimpleDeliveryProvider._id,
          configurationError: null,
          type: 'SHIPPING',
        },
        {
          _id: SendMailDeliveryProvider._id,
          configurationError: null,
          type: 'SHIPPING',
        },
        {
          _id: PickupDeliveryProvider._id,
          configurationError: null,
          type: 'PICKUP',
        },
      ]);
      expect(deliveryProviders.every(d => typeof d.isActive === 'boolean')).toBe(true);
    });

    it('return list of deliveryProviders based on the given type', async () => {
      const {
        data: { deliveryProviders },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProviders($type: DeliveryProviderType) {
            deliveryProviders(type: $type) {
              _id
            }
          }
        `,
        variables: {
          type: 'SHIPPING',
        },
      });
      expect(deliveryProviders).toMatchObject([
        { _id: SimpleDeliveryProvider._id },
        { _id: SendMailDeliveryProvider._id },
      ]);
    });
  });

  describe('Query.deliveryProvidersCount for Admin user should', () => {
    it('return total number of deliveryProviders when type is not given', async () => {
      const {
        data: { deliveryProvidersCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            deliveryProvidersCount
          }
        `,
        variables: {},
      });
      expect(deliveryProvidersCount).toEqual(3);
    });

    it('return total number of deliveryProviders based on the given type', async () => {
      const {
        data: { deliveryProvidersCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProvidersCount($type: DeliveryProviderType) {
            deliveryProvidersCount(type: $type)
          }
        `,
        variables: {
          type: 'SHIPPING',
        },
      });
      expect(deliveryProvidersCount).toEqual(2);
    });
  });

  describe('Query.deliveryProvidersCount for normal user should', () => {
    it('return total number of deliveryProviders when type is not given', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            deliveryProvidersCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions?.code).toBe('NoPermissionError');
    });
  });

  describe('Query.deliveryProvidersCount for Anonymous user should', () => {
    it('return total number of deliveryProviders when type is not given', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            deliveryProvidersCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions?.code).toBe('NoPermissionError');
    });
  });

  describe('Query.deliveryProvider for loggedin user should', () => {
    it('return single deliveryProvider when ID is provided', async () => {
      const {
        data: { deliveryProvider },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProvider($deliveryProviderId: ID!) {
            deliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
              created
              updated
              deleted
              type
              interface {
                _id
                label
                version
              }
              configuration
              configurationError
              isActive
              simulatedPrice {
                _id
                isTaxable
                isNetPrice
                amount
                currency
              }
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id,
        },
      });
      expect(deliveryProvider).toMatchObject({
        _id: SimpleDeliveryProvider._id,
        type: 'SHIPPING',
        configurationError: null,
      });
    });

    it('return value for simulatedPrice with the country default currency when no argument is passed', async () => {
      const {
        data: { deliveryProvider },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProvider($deliveryProviderId: ID!) {
            deliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
              simulatedPrice {
                _id
                amount
                currency
              }
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id,
        },
      });
      expect(deliveryProvider?.simulatedPrice?.currency).toEqual('CHF');
    });

    it('return value for simulatedPrice with value of currency argument passed to it', async () => {
      const {
        data: { deliveryProvider },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProvider($deliveryProviderId: ID!) {
            deliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
              simulatedPrice(currency: "EUR") {
                _id
                amount
                currency
              }
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id,
        },
      });
      expect(deliveryProvider?.simulatedPrice?.currency).toEqual('EUR');
    });

    it('return error when passed invalid deliveryProviderId', async () => {
      const {
        data: { deliveryProvider },
        errors,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProvider($deliveryProviderId: ID!) {
            deliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
            }
          }
        `,
        variables: {
          deliveryProviderId: '',
        },
      });
      expect(deliveryProvider).toBe(null);
      expect(errors[0]?.extensions?.code).toBe('InvalidIdError');
    });
  });

  describe('Query.deliveryProviders for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query DeliveryProviders {
            deliveryProviders {
              _id
            }
          }
        `,
        variables: {},
      });
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
