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
  });

  describe('Mutation.updateOrderDeliveryShipping', () => {
    it('update order delivery (shipping)', async () => {
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
        }
      );
      expect(updateOrderDeliveryShipping).toMatchObject({
        _id: SimpleDelivery._id,
        meta: {
          john: 'wayne',
        },
        address: {
          firstName: 'Will',
          lastName: 'Turner',
        },
      });
    });
  });

  describe('Mutation.updateOrderDeliveryPickUp', () => {
    it('update order delivery (pickup)', async () => {
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
        activePickUpLocation: {
          _id: 'zurich',
          geoPoint: null,
          name: 'Zurich',
        },
      });
    });
  });
});
