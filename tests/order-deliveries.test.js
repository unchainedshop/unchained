import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { SendMailDeliveryProvider } from './seeds/deliveries.js';
import { SimpleOrder, SimpleDelivery, PickupDelivery } from './seeds/orders.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

test.describe('Order: Deliveries', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test('admin: set order delivery provider', async () => {
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

    assert.deepStrictEqual(setOrderDeliveryProvider, {
      _id: SimpleOrder._id,
      delivery: {
        provider: {
          _id: SendMailDeliveryProvider._id,
        },
      },
    });
  });

  test('admin: return not found error for non-existing orderId', async () => {
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
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
  });

  test('admin: return error for invalid orderId', async () => {
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
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });

  test('admin: return error for invalid deliveryProviderId', async () => {
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
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });

  test('user: set order delivery provider', async () => {
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
    assert.deepStrictEqual(setOrderDeliveryProvider, {
      _id: SimpleOrder._id,
      delivery: {
        provider: {
          _id: SendMailDeliveryProvider._id,
        },
      },
    });
  });

  test('anonymous user: returns NoPermissionError', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });

  test('admin: update order delivery shipping when provider type is SHIPPING', async () => {
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
    assert.deepStrictEqual(updateOrderDeliveryShipping, {
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

  test('admin: return error when passed invalid order delivery ID', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      code: 'InvalidIdError',
    });
  });

  test('admin: return error when passed non existing order delivery ID', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      code: 'OrderDeliveryNotFoundError',
    });
  });

  test('admin: return error when order delivery provider type is not SHIPPING', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      orderDeliveryId: PickupDelivery._id,
      code: 'OrderDeliveryTypeError',
      received: 'PICKUP',
      required: 'SHIPPING',
    });
  });

  test('user: update order delivery shipping when provider type is SHIPPING', async () => {
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
    assert.deepStrictEqual(updateOrderDeliveryShipping, {
      _id: SimpleDelivery._id,
      address: {
        firstName: 'Will',
        lastName: 'Turner',
      },
    });
  });

  test('anonymous user: returns NoPermissionError', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });

  test('admin: update order delivery pickup when provider type is PICKUP', async () => {
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
    assert.deepStrictEqual(updateOrderDeliveryPickUp, {
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

  test('admin: return error when order delivery provider type is not PICKUP', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      orderDeliveryId: SimpleDelivery._id,
      code: 'OrderDeliveryTypeError',
      received: 'SHIPPING',
      required: 'PICKUP',
    });
  });

  test('admin: return error when passed invalid order delivery provider ID', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      code: 'InvalidIdError',
    });
  });

  test('admin: return error when passed non existing order delivery provider ID', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      code: 'OrderDeliveryNotFoundError',
    });
  });

  test('user: update order delivery pickup when provider type is PICKUP', async () => {
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
    assert.deepStrictEqual(updateOrderDeliveryPickUp, {
      _id: PickupDelivery._id,
      activePickUpLocation: {
        _id: 'zurich',
        name: 'Zurich',
      },
    });
  });

  test('anonymous user: returns NoPermissionError', async () => {
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
    assert.deepStrictEqual(errors[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });
});
