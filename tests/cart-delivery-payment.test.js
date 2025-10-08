import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { ShippingOrder, PickupOrder, InvoicePaymentOrder, GenericPaymentOrder } from './seeds/orders.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('Cart: Delivery and Payment Updates', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.updateCartDeliveryShipping', () => {
    test('should update cart delivery shipping for admin user', async () => {
      const {
        data: { updateCartDeliveryShipping },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateCartDeliveryShipping(
            $orderId: ID
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
                status
              }
            }
          }
        `,
        variables: {
          orderId: ShippingOrder._id,
          deliveryProviderId: 'simple-delivery-provider',
          address: {
            firstName: 'Test',
            lastName: 'User',
            addressLine: 'Test Street 1',
            postalCode: '8000',
            city: 'Zurich',
          },
          meta: {
            test: 'data',
          },
        },
      });

      assert.ok(updateCartDeliveryShipping);
      assert.strictEqual(updateCartDeliveryShipping._id, ShippingOrder._id);
      assert.ok(updateCartDeliveryShipping.delivery);
      assert.strictEqual(updateCartDeliveryShipping.delivery.provider.type, 'SHIPPING');
    });

    test('should return error for non-existing order', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateCartDeliveryShipping(
            $orderId: ID
            $deliveryProviderId: ID!
            $address: AddressInput
          ) {
            updateCartDeliveryShipping(
              orderId: $orderId
              deliveryProviderId: $deliveryProviderId
              address: $address
            ) {
              _id
            }
          }
        `,
        variables: {
          orderId: 'non-existing-order',
          deliveryProviderId: 'simple-delivery-provider',
          address: {
            firstName: 'Test',
            lastName: 'User',
            addressLine: 'Test Street 1',
            postalCode: '8000',
            city: 'Zurich',
          },
        },
      });

      assert.ok(errors);
      assert.ok(errors.length > 0);
    });

    test('should allow normal user to update their own cart', async () => {
      const {
        data: { updateCartDeliveryShipping },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation UpdateCartDeliveryShipping($deliveryProviderId: ID!, $address: AddressInput) {
            updateCartDeliveryShipping(deliveryProviderId: $deliveryProviderId, address: $address) {
              _id
              delivery {
                provider {
                  type
                }
              }
            }
          }
        `,
        variables: {
          deliveryProviderId: 'simple-delivery-provider',
          address: {
            firstName: 'Normal',
            lastName: 'User',
            addressLine: 'User Street 1',
            postalCode: '8000',
            city: 'Zurich',
          },
        },
      });

      assert.ok(updateCartDeliveryShipping);
      assert.strictEqual(updateCartDeliveryShipping.delivery.provider.type, 'SHIPPING');
    });

    test('should return error for anonymous user', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation UpdateCartDeliveryShipping($deliveryProviderId: ID!, $address: AddressInput) {
            updateCartDeliveryShipping(deliveryProviderId: $deliveryProviderId, address: $address) {
              _id
            }
          }
        `,
        variables: {
          deliveryProviderId: 'simple-delivery-provider',
          address: {
            firstName: 'Test',
            lastName: 'User',
            addressLine: 'Test Street 1',
            postalCode: '8000',
            city: 'Zurich',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.updateCartDeliveryPickUp', () => {
    test('should update cart delivery pickup for admin user', async () => {
      const {
        data: { updateCartDeliveryPickUp },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateCartDeliveryPickUp(
            $orderId: ID
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
                status
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
          orderId: PickupOrder._id,
          deliveryProviderId: 'pickup-delivery-provider',
          orderPickUpLocationId: 'zurich',
          meta: {
            test: 'pickup',
          },
        },
      });

      assert.ok(updateCartDeliveryPickUp);
      assert.strictEqual(updateCartDeliveryPickUp._id, PickupOrder._id);
      assert.ok(updateCartDeliveryPickUp.delivery);
      assert.strictEqual(updateCartDeliveryPickUp.delivery.provider.type, 'PICKUP');
      assert.strictEqual(updateCartDeliveryPickUp.delivery.activePickUpLocation._id, 'zurich');
    });

    test('should allow normal user to update their own cart pickup', async () => {
      const {
        data: { updateCartDeliveryPickUp },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation UpdateCartDeliveryPickUp($deliveryProviderId: ID!, $orderPickUpLocationId: ID!) {
            updateCartDeliveryPickUp(
              deliveryProviderId: $deliveryProviderId
              orderPickUpLocationId: $orderPickUpLocationId
            ) {
              _id
              delivery {
                provider {
                  type
                }
              }
            }
          }
        `,
        variables: {
          deliveryProviderId: 'pickup-delivery-provider',
          orderPickUpLocationId: 'zurich',
        },
      });

      assert.ok(updateCartDeliveryPickUp);
      assert.strictEqual(updateCartDeliveryPickUp.delivery.provider.type, 'PICKUP');
    });

    test('should return error for anonymous user', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation UpdateCartDeliveryPickUp($deliveryProviderId: ID!, $orderPickUpLocationId: ID!) {
            updateCartDeliveryPickUp(
              deliveryProviderId: $deliveryProviderId
              orderPickUpLocationId: $orderPickUpLocationId
            ) {
              _id
            }
          }
        `,
        variables: {
          deliveryProviderId: 'pickup-delivery-provider',
          orderPickUpLocationId: 'zurich',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.updateCartPaymentInvoice', () => {
    test('should update cart payment invoice for admin user', async () => {
      const {
        data: { updateCartPaymentInvoice },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateCartPaymentInvoice($orderId: ID, $paymentProviderId: ID!, $meta: JSON) {
            updateCartPaymentInvoice(
              orderId: $orderId
              paymentProviderId: $paymentProviderId
              meta: $meta
            ) {
              _id
              payment {
                _id
                provider {
                  _id
                  type
                }
                status
              }
            }
          }
        `,
        variables: {
          orderId: InvoicePaymentOrder._id,
          paymentProviderId: 'simple-payment-provider',
          meta: {
            invoiceData: 'test',
          },
        },
      });

      assert.ok(updateCartPaymentInvoice);
      assert.strictEqual(updateCartPaymentInvoice._id, InvoicePaymentOrder._id);
      assert.ok(updateCartPaymentInvoice.payment);
      assert.strictEqual(updateCartPaymentInvoice.payment.provider.type, 'INVOICE');
    });

    test('should allow normal user to update their own cart payment', async () => {
      const {
        data: { updateCartPaymentInvoice },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation UpdateCartPaymentInvoice($paymentProviderId: ID!, $meta: JSON) {
            updateCartPaymentInvoice(paymentProviderId: $paymentProviderId, meta: $meta) {
              _id
              payment {
                provider {
                  type
                }
              }
            }
          }
        `,
        variables: {
          paymentProviderId: 'simple-payment-provider',
          meta: {
            invoiceData: 'user-test',
          },
        },
      });

      assert.ok(updateCartPaymentInvoice);
      assert.strictEqual(updateCartPaymentInvoice.payment.provider.type, 'INVOICE');
    });

    test('should return error for anonymous user', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation UpdateCartPaymentInvoice($paymentProviderId: ID!, $meta: JSON) {
            updateCartPaymentInvoice(paymentProviderId: $paymentProviderId, meta: $meta) {
              _id
            }
          }
        `,
        variables: {
          paymentProviderId: 'simple-payment-provider',
          meta: {},
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.updateCartPaymentGeneric', () => {
    test('should update cart payment generic for admin user', async () => {
      const {        
        data: { updateCartPaymentGeneric },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation UpdateCartPaymentGeneric($orderId: ID, $paymentProviderId: ID!, $meta: JSON) {
            updateCartPaymentGeneric(
              orderId: $orderId
              paymentProviderId: $paymentProviderId
              meta: $meta
            ) {
              _id
              payment {
                _id
                provider {
                  _id
                  type
                }
                status
              }
            }
          }
        `,
        variables: {
          orderId: GenericPaymentOrder._id,
          paymentProviderId: 'generic-payment-provider',
          meta: {
            genericData: 'test',
          },
        },
      });
      assert.ok(updateCartPaymentGeneric);
      assert.strictEqual(updateCartPaymentGeneric._id, GenericPaymentOrder._id);
      assert.ok(updateCartPaymentGeneric.payment);
      assert.strictEqual(updateCartPaymentGeneric.payment.provider.type, 'GENERIC');
    });

    test('should allow normal user to update their own cart payment', async () => {
      const {
        data: { updateCartPaymentGeneric },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation UpdateCartPaymentGeneric($paymentProviderId: ID!, $meta: JSON) {
            updateCartPaymentGeneric(paymentProviderId: $paymentProviderId, meta: $meta) {
              _id
              payment {
                provider {
                  type
                }
              }
            }
          }
        `,
        variables: {
          paymentProviderId: 'generic-payment-provider',
          meta: {
            genericData: 'user-test',
          },
        },
      });

      assert.ok(updateCartPaymentGeneric);
      assert.strictEqual(updateCartPaymentGeneric.payment.provider.type, 'GENERIC');
    });

    test('should return error for anonymous user', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation UpdateCartPaymentGeneric($paymentProviderId: ID!, $meta: JSON) {
            updateCartPaymentGeneric(paymentProviderId: $paymentProviderId, meta: $meta) {
              _id
            }
          }
        `,
        variables: {
          paymentProviderId: 'generic-payment-provider',
          meta: {},
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
