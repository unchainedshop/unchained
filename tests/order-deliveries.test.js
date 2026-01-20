import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import {
  SendMailDeliveryProvider,
  SimpleDeliveryProvider,
  PickupDeliveryProvider,
} from './seeds/deliveries.js';
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
    const { data: { updateCart } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID!, $deliveryProviderId: ID!) {
          updateCart(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
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

    assert.partialDeepStrictEqual(updateCart, {
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
        mutation updateCart($orderId: ID!, $deliveryProviderId: ID!) {
          updateCart(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
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
        mutation updateCart($orderId: ID, $deliveryProviderId: ID) {
          updateCart(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
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
        mutation updateCart($orderId: ID, $deliveryProviderId: ID) {
          updateCart(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
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
    const { data: { updateCart } = {} } = await graphqlFetchAsNormalUser({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID!, $deliveryProviderId: ID!) {
          updateCart(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
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
    assert.partialDeepStrictEqual(updateCart, {
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
        mutation updateCart($orderId: ID!, $deliveryProviderId: ID!) {
          updateCart(orderId: $orderId, deliveryProviderId: $deliveryProviderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: SendMailDeliveryProvider._id,
      },
    });
    assert.partialDeepStrictEqual(errors[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });

  test('admin: update order delivery shipping when provider type is SHIPPING', async () => {
    const { data: { updateCartDeliveryShipping } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartDeliveryShipping(
          $orderId: ID!
          $deliveryProviderId: ID!
          $address: AddressInput
          $meta: JSON
        ) {
          updateCartDeliveryShipping(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            address: $address
            meta: $meta
          ) {
            _id
            delivery {
              _id
              provider {
                _id
                type
              }
              fee {
                amount
              }
              ... on OrderDeliveryShipping {
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
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: SimpleDeliveryProvider._id,
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(updateCartDeliveryShipping, {
      _id: SimpleOrder._id,
      delivery: {
        _id: SimpleDelivery._id,
        provider: {
          type: 'SHIPPING',
        },
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
      },
    });
  });

  test('admin: update order delivery shipping allows empty orderId for user cart', async () => {
    const { data: { updateCartDeliveryShipping } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartDeliveryShipping(
          $orderId: ID!
          $deliveryProviderId: ID!
          $address: AddressInput
          $meta: JSON
        ) {
          updateCartDeliveryShipping(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            address: $address
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: '',
        deliveryProviderId: SimpleDeliveryProvider._id,
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
        meta: {
          john: 'wayne',
        },
      },
    });
    // Empty orderId is valid - it uses the user's active cart
    assert.ok(updateCartDeliveryShipping?._id);
  });

  test('admin: return error when passed non existing order delivery ID', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartDeliveryShipping(
          $orderId: ID!
          $deliveryProviderId: ID!
          $address: AddressInput
          $meta: JSON
        ) {
          updateCartDeliveryShipping(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            address: $address
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: 'non-existing-id',
        deliveryProviderId: SimpleDeliveryProvider._id,
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(errors[0]?.extensions, {
      code: 'OrderNotFoundError',
    });
  });

  test('admin: return error when order delivery provider type is not SHIPPING', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartDeliveryShipping(
          $orderId: ID!
          $deliveryProviderId: ID!
          $address: AddressInput
          $meta: JSON
        ) {
          updateCartDeliveryShipping(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            address: $address
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: PickupDeliveryProvider._id,
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(errors[0]?.extensions, {
      orderId: SimpleOrder._id,
      code: 'OrderDeliveryTypeError',
      received: 'PICKUP',
      required: 'SHIPPING',
    });
  });

  test('user: update order delivery shipping when provider type is SHIPPING', async () => {
    const { data: { updateCartDeliveryShipping } = {} } = await graphqlFetchAsNormalUser({
      query: /* GraphQL */ `
        mutation updateCartDeliveryShipping(
          $orderId: ID!
          $deliveryProviderId: ID!
          $address: AddressInput
          $meta: JSON
        ) {
          updateCartDeliveryShipping(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            address: $address
            meta: $meta
          ) {
            _id
            delivery {
              _id
              ... on OrderDeliveryShipping {
                address {
                  firstName
                  lastName
                }
              }
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: SimpleDeliveryProvider._id,
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(updateCartDeliveryShipping, {
      _id: SimpleOrder._id,
      delivery: {
        _id: SimpleDelivery._id,
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
      },
    });
  });

  test('anonymous user: returns NoPermissionError', async () => {
    const { errors } = await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        mutation updateCartDeliveryShipping(
          $orderId: ID!
          $deliveryProviderId: ID!
          $address: AddressInput
          $meta: JSON
        ) {
          updateCartDeliveryShipping(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            address: $address
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: SimpleDeliveryProvider._id,
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(errors[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });

  test('admin: update order delivery pickup when provider type is PICKUP', async () => {
    const { data: { updateCartDeliveryPickUp } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartDeliveryPickUp(
          $orderId: ID!
          $deliveryProviderId: ID!
          $orderPickUpLocationId: ID!
          $meta: JSON
        ) {
          updateCartDeliveryPickUp(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            orderPickUpLocationId: $orderPickUpLocationId
            meta: $meta
          ) {
            _id
            delivery {
              _id
              provider {
                _id
                type
              }
              ... on OrderDeliveryPickUp {
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
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: PickupDeliveryProvider._id,
        orderPickUpLocationId: 'zurich',
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(updateCartDeliveryPickUp, {
      _id: SimpleOrder._id,
      delivery: {
        _id: PickupDelivery._id,
        provider: {
          type: 'PICKUP',
        },
        activePickUpLocation: {
          _id: 'zurich',
          geoPoint: null,
          name: 'Zurich',
        },
      },
    });
  });

  test('admin: return error when order delivery provider type is not PICKUP', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartDeliveryPickUp(
          $orderId: ID!
          $deliveryProviderId: ID!
          $orderPickUpLocationId: ID!
          $meta: JSON
        ) {
          updateCartDeliveryPickUp(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            orderPickUpLocationId: $orderPickUpLocationId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: SimpleDeliveryProvider._id,
        orderPickUpLocationId: 'zurich',
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(errors[0]?.extensions, {
      orderId: SimpleOrder._id,
      code: 'OrderDeliveryTypeError',
      received: 'SHIPPING',
      required: 'PICKUP',
    });
  });

  test('admin: update order delivery pickup allows empty orderId for user cart', async () => {
    const { data: { updateCartDeliveryPickUp } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartDeliveryPickUp(
          $orderId: ID!
          $deliveryProviderId: ID!
          $orderPickUpLocationId: ID!
          $meta: JSON
        ) {
          updateCartDeliveryPickUp(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            orderPickUpLocationId: $orderPickUpLocationId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: '',
        deliveryProviderId: PickupDeliveryProvider._id,
        orderPickUpLocationId: 'zurich',
        meta: {
          john: 'wayne',
        },
      },
    });
    // Empty orderId is valid - it uses the user's active cart
    assert.ok(updateCartDeliveryPickUp?._id);
  });

  test('admin: return error when passed non existing order delivery provider ID', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartDeliveryPickUp(
          $orderId: ID!
          $deliveryProviderId: ID!
          $orderPickUpLocationId: ID!
          $meta: JSON
        ) {
          updateCartDeliveryPickUp(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            orderPickUpLocationId: $orderPickUpLocationId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: 'non-existing-id',
        deliveryProviderId: PickupDeliveryProvider._id,
        orderPickUpLocationId: 'zurich',
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(errors[0]?.extensions, {
      code: 'OrderNotFoundError',
    });
  });

  test('user: update order delivery pickup when provider type is PICKUP', async () => {
    const { data: { updateCartDeliveryPickUp } = {} } = await graphqlFetchAsNormalUser({
      query: /* GraphQL */ `
        mutation updateCartDeliveryPickUp(
          $orderId: ID!
          $deliveryProviderId: ID!
          $orderPickUpLocationId: ID!
          $meta: JSON
        ) {
          updateCartDeliveryPickUp(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            orderPickUpLocationId: $orderPickUpLocationId
            meta: $meta
          ) {
            _id
            delivery {
              _id
              ... on OrderDeliveryPickUp {
                activePickUpLocation {
                  _id
                  name
                }
              }
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: PickupDeliveryProvider._id,
        orderPickUpLocationId: 'zurich',
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(updateCartDeliveryPickUp, {
      _id: SimpleOrder._id,
      delivery: {
        _id: PickupDelivery._id,
        activePickUpLocation: {
          _id: 'zurich',
          name: 'Zurich',
        },
      },
    });
  });

  test('anonymous user: returns NoPermissionError', async () => {
    const { errors } = await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        mutation updateCartDeliveryPickUp(
          $orderId: ID!
          $deliveryProviderId: ID!
          $orderPickUpLocationId: ID!
          $meta: JSON
        ) {
          updateCartDeliveryPickUp(
            orderId: $orderId
            deliveryProviderId: $deliveryProviderId
            orderPickUpLocationId: $orderPickUpLocationId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        deliveryProviderId: PickupDeliveryProvider._id,
        orderPickUpLocationId: 'zurich',
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(errors[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });
});
