import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SendMailDeliveryProvider } from './seeds/deliveries';
import { SimpleOrder, SimpleDelivery, PickupDelivery } from './seeds/orders';

let connection;
let graphqlFetch;

describe('Order: Deliveries', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.setOrderDeliveryProvider', () => {
    it('set order delivery provider', async () => {
      const { data: { setOrderDeliveryProvider } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider(
            $orderId: ID!
            $deliveryProviderId: ID!
          ) {
            setOrderDeliveryProvider(
              orderId: $orderId
              deliveryProviderId: $deliveryProviderId
            ) {
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
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider(
            $orderId: ID!
            $deliveryProviderId: ID!
          ) {
            setOrderDeliveryProvider(
              orderId: $orderId
              deliveryProviderId: $deliveryProviderId
            ) {
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
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider(
            $orderId: ID!
            $deliveryProviderId: ID!
          ) {
            setOrderDeliveryProvider(
              orderId: $orderId
              deliveryProviderId: $deliveryProviderId
            ) {
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
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setOrderDeliveryProvider(
            $orderId: ID!
            $deliveryProviderId: ID!
          ) {
            setOrderDeliveryProvider(
              orderId: $orderId
              deliveryProviderId: $deliveryProviderId
            ) {
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

  describe('Mutation.updateOrderDeliveryShipping', () => {
    it('update order delivery shipping successfuly when order delivery provider type is SHIPPING', async () => {
      const { data: { updateOrderDeliveryShipping } = {} } = await graphqlFetch(
        {
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
                meta
                provider {
                  _id
                  type
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
        },
      );
      expect(updateOrderDeliveryShipping).toMatchObject({
        _id: SimpleDelivery._id,
        meta: {
          john: 'wayne',
        },
        provider: {
          type: 'SHIPPING',
        },
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
      });
    });

    it('return error when order delivery provider type is not SHIPPING', async () => {
      const { errors } = await graphqlFetch({
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
        recieved: 'PICKUP',
        required: 'SHIPPING',
      });
    });
  });

  describe('Mutation.updateOrderDeliveryPickUp', () => {
    it('update order delivery pickup successfuly when order delivery provider type is PICKUP', async () => {
      const { data: { updateOrderDeliveryPickUp } = {} } = await graphqlFetch({
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
              meta
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
        meta: {
          john: 'wayne',
        },
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
      const { errors } = await graphqlFetch({
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
        recieved: 'SHIPPING',
        required: 'PICKUP',
      });
    });
  });
});
