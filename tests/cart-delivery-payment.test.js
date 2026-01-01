import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import {
  ShippingOrder,
  PickupOrder,
  InvoicePaymentOrder,
  GenericPaymentOrder,
  ConfirmedOrder,
} from './seeds/orders.js';
import {
  GenericPaymentProvider,
  PrePaidPaymentProvider,
  SimplePaymentProvider,
} from './seeds/payments.js';
import { PickupDeliveryProvider, SimpleDeliveryProvider } from './seeds/deliveries.js';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('Cart: Delivery and Payment Updates', () => {
  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
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
          deliveryProviderId: SimpleDeliveryProvider._id,
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

    test('should return OrderNotFoundError for non-existing order', async () => {
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
          deliveryProviderId: SimpleDeliveryProvider._id,
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
      assert.strictEqual(errors[0].extensions?.code, 'OrderNotFoundError');
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
          deliveryProviderId: SimpleDeliveryProvider._id,
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
          deliveryProviderId: SimpleDeliveryProvider._id,
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
    test('should throw OrderDeliveryTypeError when given unsupported delivery provider ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          deliveryProviderId: PickupDeliveryProvider._id,
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderDeliveryTypeError');
      assert.strictEqual(errors[0].extensions?.orderId, ShippingOrder._id);
      assert.strictEqual(errors[0].extensions?.received, 'PICKUP');
      assert.strictEqual(errors[0].extensions?.required, 'SHIPPING');
    });

    test('should throw OrderDeliveryTypeError when given non-existing delivery provider ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          deliveryProviderId: 'non-existing-provider',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderDeliveryTypeError');
    });

    test('should throw OrderWrongStatusError if order is not on cart status', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          orderId: ConfirmedOrder._id,
          deliveryProviderId: SimpleDeliveryProvider._id,
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderWrongStatusError');
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
          deliveryProviderId: PickupDeliveryProvider._id,
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

    test('should throw OrderNotFoundError when non-existing order ID is provided', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation UpdateCartDeliveryPickUp(
            $orderId: ID
            $deliveryProviderId: ID!
            $orderPickUpLocationId: ID!
          ) {
            updateCartDeliveryPickUp(
              orderId: $orderId
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
          orderId: 'non-existing-order',
          deliveryProviderId: PickupDeliveryProvider._id,
          orderPickUpLocationId: 'zurich',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
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
          deliveryProviderId: PickupDeliveryProvider._id,
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
          deliveryProviderId: PickupDeliveryProvider._id,
          orderPickUpLocationId: 'zurich',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
    test('should throw OrderDeliveryTypeError when incompatible delivery provider ID is passed', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          deliveryProviderId: SimpleDeliveryProvider._id,
          orderPickUpLocationId: 'zurich',
          meta: {
            test: 'pickup',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderDeliveryTypeError');
      assert.strictEqual(errors[0].extensions?.orderId, PickupOrder._id);
      assert.strictEqual(errors[0].extensions?.received, 'SHIPPING');
      assert.strictEqual(errors[0].extensions?.required, 'PICKUP');
    });

    test('should throw OrderDeliveryTypeError when non-existing delivery provider ID is passed', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          deliveryProviderId: 'non-existing-provider',
          orderPickUpLocationId: 'zurich',
          meta: {
            test: 'pickup',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderDeliveryTypeError');
    });

    test('should throw OrderWrongStatusError if order is not on cart status', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          orderId: ConfirmedOrder._id,
          deliveryProviderId: PickupDeliveryProvider._id,
          orderPickUpLocationId: 'zurich',
          meta: {
            test: 'pickup',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderWrongStatusError');
    });

    test('should throw OrderNotFoundError when non-existing order ID is given', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          orderId: 'non-existing-order',
          deliveryProviderId: PickupDeliveryProvider._id,
          orderPickUpLocationId: 'zurich',
          meta: {
            test: 'pickup',
          },
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderNotFoundError');
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
          paymentProviderId: SimplePaymentProvider._id,
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
          paymentProviderId: SimplePaymentProvider._id,
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
          paymentProviderId: SimplePaymentProvider._id,
          meta: {},
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
    test('should throw OrderPaymentTypeError when unsupported payment provider is given', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          paymentProviderId: GenericPaymentProvider._id,
          meta: {
            invoiceData: 'test',
          },
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'OrderPaymentTypeError');
      assert.strictEqual(errors[0].extensions?.orderId, InvoicePaymentOrder._id);
      assert.strictEqual(errors[0].extensions?.received, 'GENERIC');
      assert.strictEqual(errors[0].extensions?.required, 'INVOICE');
    });

    test('should throw OrderNotFoundError non-existing order ID is given', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          orderId: 'non-existing-order',
          paymentProviderId: SimplePaymentProvider._id,
          meta: {
            invoiceData: 'test',
          },
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'OrderNotFoundError');
    });

    test('should throw OrderPaymentTypeError non-existing payment provider ID is given', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          paymentProviderId: 'non-existing-provider',
          meta: {
            invoiceData: 'test',
          },
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'OrderPaymentTypeError');
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
          paymentProviderId: GenericPaymentProvider._id,
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
          paymentProviderId: GenericPaymentProvider._id,
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
          paymentProviderId: GenericPaymentProvider._id,
          meta: {},
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
    test('should throw OrderPaymentTypeError when incompatible payment provider is provided', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          paymentProviderId: PrePaidPaymentProvider._id,
          meta: {
            genericData: 'test',
          },
        },
      });
      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderPaymentTypeError');
      assert.strictEqual(errors[0].extensions?.orderId, GenericPaymentOrder._id);
      assert.strictEqual(errors[0].extensions?.received, 'INVOICE');
      assert.strictEqual(errors[0].extensions?.required, 'GENERIC');
    });

    test('should throw OrderPaymentTypeError non-existing payment provider ID is given', async () => {
      const { errors } = await graphqlFetchAsAdmin({
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
          paymentProviderId: 'non-existing-provider',
          meta: {
            genericData: 'test',
          },
        },
      });
      assert.ok(errors);
      assert.strictEqual(errors[0].extensions?.code, 'OrderPaymentTypeError');
    });
  });
});
