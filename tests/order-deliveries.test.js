import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { SendMailDeliveryProvider } from './seeds/deliveries.js';
import { SimpleOrder, SimpleDelivery, PickupDelivery } from './seeds/orders.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('Order: Deliveries', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  describe('Mutation.setOrderDeliveryProvider for admin user', () => {
    it('set order delivery provider', async () => {
      const { data: { setOrderDeliveryProvider } = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider($orderId: ID!, $deliveryProviderId: ID!) {
            setOrderDeliveryProvider(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
              _id
              status
              delivery {
                _id
                provider {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          deliveryProviderId: SendMailDeliveryProvider._id,
        },
      });

      expect(setOrderDeliveryProvider).toMatchObject({
        _id: SimpleOrder._id,
        delivery: {
          provider: {
            _id: SendMailDeliveryProvider._id,
          },
        },
      });
    });

    it('return not found error when passed non existing orderId', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider($orderId: ID!, $deliveryProviderId: ID!) {
            setOrderDeliveryProvider(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: 'non-existing-id',
          deliveryProviderId: SendMailDeliveryProvider._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderNotFoundError');
    });

    it('return error when passed invalid orderId', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider($orderId: ID!, $deliveryProviderId: ID!) {
            setOrderDeliveryProvider(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: '',
          deliveryProviderId: SendMailDeliveryProvider._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return error when passed invalid deliveryProviderId', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider($orderId: ID!, $deliveryProviderId: ID!) {
            setOrderDeliveryProvider(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          deliveryProviderId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.setOrderDeliveryProvider for logged in user should', () => {
    it('set order delivery provider', async () => {
      const { data: { setOrderDeliveryProvider } = {} } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider($orderId: ID!, $deliveryProviderId: ID!) {
            setOrderDeliveryProvider(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
              _id
              delivery {
                provider {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          deliveryProviderId: SendMailDeliveryProvider._id,
        },
      });
      expect(setOrderDeliveryProvider).toMatchObject({
        _id: SimpleOrder._id,
        delivery: {
          provider: {
            _id: SendMailDeliveryProvider._id,
          },
        },
      });
    });
  });

  describe('Mutation.setOrderDeliveryProvider for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider($orderId: ID!, $deliveryProviderId: ID!) {
            setOrderDeliveryProvider(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          deliveryProviderId: SendMailDeliveryProvider._id,
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });

  describe('Mutation.updateOrderDeliveryShipping for admin user should', () => {
    it('update order delivery shipping successfuly when order delivery provider type is SHIPPING', async () => {
      const { data: { updateOrderDeliveryShipping } = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryShipping(
            $orderDeliveryId: ID!
            $address: AddressInput
            $meta: JSON
          ) {
            updateOrderDeliveryShipping(
              orderDeliveryId: $orderDeliveryId
              address: $address
              meta: $meta
            ) {
              _id
              provider {
                _id
                type
              }
              fee {
                amount
              }
              address {
                firstName
                lastName
                company
                addressLine
                addressLine2
                postalCode
                countryCode
                regionCode
                city
              }
            }
          }
        `,
        variables: {
          orderDeliveryId: SimpleDelivery._id,
          address: {
            firstName: 'Will',
            lastName: 'Turner',
          },
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(updateOrderDeliveryShipping).toMatchObject({
        _id: SimpleDelivery._id,
        provider: {
          type: 'SHIPPING',
        },
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
      });
    });

    it('return error when passed invalid order delivery ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryShipping(
            $orderDeliveryId: ID!
            $address: AddressInput
            $meta: JSON
          ) {
            updateOrderDeliveryShipping(
              orderDeliveryId: $orderDeliveryId
              address: $address
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderDeliveryId: '',
          address: {
            firstName: 'Will',
            lastName: 'Turner',
          },
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'InvalidIdError',
      });
    });

    it('return error when passed non existing order delivery ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryShipping(
            $orderDeliveryId: ID!
            $address: AddressInput
            $meta: JSON
          ) {
            updateOrderDeliveryShipping(
              orderDeliveryId: $orderDeliveryId
              address: $address
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderDeliveryId: 'non-existing-id',
          address: {
            firstName: 'Will',
            lastName: 'Turner',
          },
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'OrderDeliveryNotFoundError',
      });
    });

    it('return error when order delivery provider type is not SHIPPING', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryShipping(
            $orderDeliveryId: ID!
            $address: AddressInput
            $meta: JSON
          ) {
            updateOrderDeliveryShipping(
              orderDeliveryId: $orderDeliveryId
              address: $address
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderDeliveryId: PickupDelivery._id,
          address: {
            firstName: 'Will',
            lastName: 'Turner',
          },
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        orderDeliveryId: PickupDelivery._id,
        code: 'OrderDeliveryTypeError',
        received: 'PICKUP',
        required: 'SHIPPING',
      });
    });
  });

  describe('Mutation.updateOrderDeliveryShipping for logged in user should', () => {
    it('update order delivery shipping successfuly when order delivery provider type is SHIPPING', async () => {
      const { data: { updateOrderDeliveryShipping } = {} } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryShipping(
            $orderDeliveryId: ID!
            $address: AddressInput
            $meta: JSON
          ) {
            updateOrderDeliveryShipping(
              orderDeliveryId: $orderDeliveryId
              address: $address
              meta: $meta
            ) {
              _id
              address {
                firstName
                lastName
              }
            }
          }
        `,
        variables: {
          orderDeliveryId: SimpleDelivery._id,
          address: {
            firstName: 'Will',
            lastName: 'Turner',
          },
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(updateOrderDeliveryShipping).toMatchObject({
        _id: SimpleDelivery._id,
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
      });
    });
  });

  describe('Mutation.updateOrderDeliveryShipping for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryShipping(
            $orderDeliveryId: ID!
            $address: AddressInput
            $meta: JSON
          ) {
            updateOrderDeliveryShipping(
              orderDeliveryId: $orderDeliveryId
              address: $address
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderDeliveryId: SimpleDelivery._id,
          address: {
            firstName: 'Will',
            lastName: 'Turner',
          },
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });

  describe('Mutation.updateOrderDeliveryPickUp for admin user', () => {
    it('update order delivery pickup successfuly when order delivery provider type is PICKUP', async () => {
      const { data: { updateOrderDeliveryPickUp } = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryPickUp(
            $orderDeliveryId: ID!
            $orderPickUpLocationId: ID!
            $meta: JSON
          ) {
            updateOrderDeliveryPickUp(
              orderDeliveryId: $orderDeliveryId
              orderPickUpLocationId: $orderPickUpLocationId
              meta: $meta
            ) {
              _id
              provider {
                _id
                type
              }
              activePickUpLocation {
                _id
                name
                geoPoint {
                  latitude
                  longitude
                  altitute
                }
              }
            }
          }
        `,
        variables: {
          orderDeliveryId: PickupDelivery._id,
          orderPickUpLocationId: 'zurich',
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(updateOrderDeliveryPickUp).toMatchObject({
        _id: PickupDelivery._id,
        provider: {
          type: 'PICKUP',
        },
        activePickUpLocation: {
          _id: 'zurich',
          geoPoint: null,
          name: 'Zurich',
        },
      });
    });

    it('return error when order delivery provider type is not PICKUP', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryPickUp(
            $orderDeliveryId: ID!
            $orderPickUpLocationId: ID!
            $meta: JSON
          ) {
            updateOrderDeliveryPickUp(
              orderDeliveryId: $orderDeliveryId
              orderPickUpLocationId: $orderPickUpLocationId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderDeliveryId: SimpleDelivery._id,
          orderPickUpLocationId: 'zurich',
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        orderDeliveryId: SimpleDelivery._id,
        code: 'OrderDeliveryTypeError',
        received: 'SHIPPING',
        required: 'PICKUP',
      });
    });

    it('return error when passed invalid order delivery provider ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryPickUp(
            $orderDeliveryId: ID!
            $orderPickUpLocationId: ID!
            $meta: JSON
          ) {
            updateOrderDeliveryPickUp(
              orderDeliveryId: $orderDeliveryId
              orderPickUpLocationId: $orderPickUpLocationId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderDeliveryId: '',
          orderPickUpLocationId: 'zurich',
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'InvalidIdError',
      });
    });

    it('return error when passed non existing order delivery provider ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryPickUp(
            $orderDeliveryId: ID!
            $orderPickUpLocationId: ID!
            $meta: JSON
          ) {
            updateOrderDeliveryPickUp(
              orderDeliveryId: $orderDeliveryId
              orderPickUpLocationId: $orderPickUpLocationId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderDeliveryId: 'non-existing-id',
          orderPickUpLocationId: 'zurich',
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'OrderDeliveryNotFoundError',
      });
    });
  });

  describe('Mutation.updateOrderDeliveryPickUp for logged in user should', () => {
    it('update order delivery pickup successfuly when order delivery provider type is PICKUP', async () => {
      const { data: { updateOrderDeliveryPickUp } = {} } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryPickUp(
            $orderDeliveryId: ID!
            $orderPickUpLocationId: ID!
            $meta: JSON
          ) {
            updateOrderDeliveryPickUp(
              orderDeliveryId: $orderDeliveryId
              orderPickUpLocationId: $orderPickUpLocationId
              meta: $meta
            ) {
              _id
              activePickUpLocation {
                _id
                name
              }
            }
          }
        `,
        variables: {
          orderDeliveryId: PickupDelivery._id,
          orderPickUpLocationId: 'zurich',
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(updateOrderDeliveryPickUp).toMatchObject({
        _id: PickupDelivery._id,
        activePickUpLocation: {
          _id: 'zurich',
          name: 'Zurich',
        },
      });
    });
  });

  describe('Mutation.updateOrderDeliveryPickUp for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation updateOrderDeliveryPickUp(
            $orderDeliveryId: ID!
            $orderPickUpLocationId: ID!
            $meta: JSON
          ) {
            updateOrderDeliveryPickUp(
              orderDeliveryId: $orderDeliveryId
              orderPickUpLocationId: $orderPickUpLocationId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderDeliveryId: PickupDelivery._id,
          orderPickUpLocationId: 'zurich',
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });
});
