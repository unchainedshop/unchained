import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import {
  PickupDeliveryProvider,
  SendMailDeliveryProvider,
  SimpleDeliveryProvider,
} from './seeds/deliveries.js';

let graphqlFetch;
let graphqlFetchAsAnonymousUser;
let graphqlFetchAsNormalUser;

describe('DeliveryProviders', () => {
  before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
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
      assert.deepEqual(deliveryProviders, [
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
      assert(deliveryProviders.every((d) => typeof d.isActive === 'boolean'));
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
      assert.deepEqual(deliveryProviders, [
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
      assert.equal(deliveryProvidersCount, 3);
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
      assert.equal(deliveryProvidersCount, 2);
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
      assert.equal(errors[0]?.extensions?.code, 'NoPermissionError');
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
      assert.equal(errors[0]?.extensions?.code, 'NoPermissionError');
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
      assert.deepEqual(deliveryProvider, {
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
      assert.equal(deliveryProvider?.simulatedPrice?.currency, 'CHF');
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
      assert.equal(deliveryProvider?.simulatedPrice?.currency, 'EUR');
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
      assert.equal(deliveryProvider, null);
      assert.equal(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  describe('Query.deliveryProviders for anonymous user should', () => {
    it('return error', async () => {
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
