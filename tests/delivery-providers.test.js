import test from 'node:test';
import assert from 'node:assert/strict';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import {
  PickupDeliveryProvider,
  SendMailDeliveryProvider,
  SimpleDeliveryProvider,
} from './seeds/deliveries.js';

let graphqlFetch;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

test.describe('Delivery: Providers', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.deliveryProviders for admin user should', () => {
    test('return array of all deliveryProviders when type is not given', async () => {
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
                isTaxable
                isNetPrice
                amount
                currencyCode
              }
            }
          }
        `,
        variables: {},
      });

      assert.equal(deliveryProviders.length, 3);

      assert.partialDeepStrictEqual(deliveryProviders[0], {
        _id: SimpleDeliveryProvider._id,
        type: 'SHIPPING',
        configurationError: null,
      });

      assert.partialDeepStrictEqual(deliveryProviders[1], {
        _id: SendMailDeliveryProvider._id,
        type: 'SHIPPING',
        configurationError: null,
      });

      assert.partialDeepStrictEqual(deliveryProviders[2], {
        _id: PickupDeliveryProvider._id,
        type: 'PICKUP',
        configurationError: null,
      });

      assert(deliveryProviders.every((d) => typeof d.isActive === 'boolean'));
    });

    test('return list of deliveryProviders based on the given type', async () => {
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
      assert.deepEqual(deliveryProviders, [
        { _id: SimpleDeliveryProvider._id },
        { _id: SendMailDeliveryProvider._id },
      ]);
    });
  });

  test.describe('Query.deliveryProvidersCount for Admin user should', () => {
    test('return total number of deliveryProviders when type is not given', async () => {
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
      assert.equal(deliveryProvidersCount, 3);
    });

    test('return total number of deliveryProviders based on the given type', async () => {
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
      assert.equal(deliveryProvidersCount, 2);
    });
  });

  test.describe('Query.deliveryProvidersCount for normal user should', () => {
    test('return total number of deliveryProviders when type is not given', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            deliveryProvidersCount
          }
        `,
        variables: {},
      });
      assert.equal(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.deliveryProvidersCount for Anonymous user should', () => {
    test('return total number of deliveryProviders when type is not given', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            deliveryProvidersCount
          }
        `,
        variables: {},
      });
      assert.equal(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.deliveryProvider for loggedin user should', () => {
    test('return single deliveryProvider when ID is provided', async () => {
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
                isTaxable
                isNetPrice
                amount
                currencyCode
              }
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id,
        },
      });
      assert.partialDeepStrictEqual(deliveryProvider, {
        _id: SimpleDeliveryProvider._id,
        type: 'SHIPPING',
        configurationError: null,
      });
    });

    test('return value for simulatedPrice with the country default currency when no argument is passed', async () => {
      const {
        data: { deliveryProvider },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProvider($deliveryProviderId: ID!) {
            deliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
              simulatedPrice {
                amount
                currencyCode
              }
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id,
        },
      });
      assert.equal(deliveryProvider?.simulatedPrice?.currencyCode, 'CHF');
    });

    test('return value for simulatedPrice with value of currency argument passed to it', async () => {
      const {
        data: { deliveryProvider },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query DeliveryProvider($deliveryProviderId: ID!) {
            deliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
              simulatedPrice(currencyCode: "EUR") {
                amount
                currencyCode
              }
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id,
        },
      });
      assert.equal(deliveryProvider?.simulatedPrice?.currencyCode, 'EUR');
    });

    test('return error when passed invalid deliveryProviderId', async () => {
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
      assert.equal(deliveryProvider, null);
      assert.equal(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Query.deliveryProviders for anonymous user should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
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
      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
