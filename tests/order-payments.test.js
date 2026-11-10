import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import {
  PrePaidPaymentProvider,
  SimplePaymentProvider,
  GenericPaymentProvider,
} from './seeds/payments.js';
import { SimpleOrder, SimplePayment, GenericPayment } from './seeds/orders.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

test.describe('Order: Payments', () => {
  let graphqlFetchAsAdmin;
  let graphqlFetchAsNormalUser;
  let graphqlFetchAsAnonymousUser;

  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test('admin: set order payment provider', async () => {
    const { data: { updateCart } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID!, $paymentProviderId: ID!) {
          updateCart(orderId: $orderId, paymentProviderId: $paymentProviderId) {
            _id
            status
            payment {
              _id
              provider {
                _id
              }
              fee {
                amount
              }
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: PrePaidPaymentProvider._id,
      },
    });
    assert.partialDeepStrictEqual(updateCart, {
      _id: SimpleOrder._id,
      payment: {
        provider: {
          _id: PrePaidPaymentProvider._id,
        },
      },
    });
  });

  test('admin: returns not found error when passed non existing orderId', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID!, $paymentProviderId: ID!) {
          updateCart(orderId: $orderId, paymentProviderId: $paymentProviderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: 'non-existing-id',
        paymentProviderId: PrePaidPaymentProvider._id,
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
  });

  test('admin: returns error when passed invalid paymentProviderId', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID, $paymentProviderId: ID) {
          updateCart(orderId: $orderId, paymentProviderId: $paymentProviderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: '',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });

  test('admin: returns error when passed invalid orderId', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID, $paymentProviderId: ID) {
          updateCart(orderId: $orderId, paymentProviderId: $paymentProviderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: '',
        paymentProviderId: PrePaidPaymentProvider._id,
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });

  test('user: set order payment provider successfully', async () => {
    const { data: { updateCart } = {} } = await graphqlFetchAsNormalUser({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID!, $paymentProviderId: ID!) {
          updateCart(orderId: $orderId, paymentProviderId: $paymentProviderId) {
            _id
            payment {
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
        paymentProviderId: PrePaidPaymentProvider._id,
      },
    });
    assert.partialDeepStrictEqual(updateCart, {
      _id: SimpleOrder._id,
      payment: {
        provider: { _id: PrePaidPaymentProvider._id },
      },
    });
  });

  test('anonymous: return NoPermissionError', async () => {
    const { errors } = await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID!, $paymentProviderId: ID!) {
          updateCart(orderId: $orderId, paymentProviderId: $paymentProviderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: PrePaidPaymentProvider._id,
      },
    });
    assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });

  test('admin: update order payment (invoice & card)', async () => {
    const { data: { updateCartPaymentInvoice } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartPaymentInvoice($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
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
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: SimplePaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });

    assert.partialDeepStrictEqual(updateCartPaymentInvoice, {
      _id: SimpleOrder._id,
      payment: {
        _id: SimplePayment._id,
        provider: {
          type: 'INVOICE',
        },
      },
    });
  });

  test('admin: return not found error when passed non existing order payment ID', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartPaymentInvoice($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
          updateCartPaymentInvoice(
            orderId: $orderId
            paymentProviderId: $paymentProviderId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: 'non-existing-id',
        paymentProviderId: SimplePaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });

    assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
      code: 'OrderNotFoundError',
    });
  });

  test('admin: update payment with empty orderId uses user cart', async () => {
    const { data: { updateCartPaymentInvoice } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartPaymentInvoice($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
          updateCartPaymentInvoice(
            orderId: $orderId
            paymentProviderId: $paymentProviderId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: '',
        paymentProviderId: SimplePaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });

    // Empty orderId is valid - it uses the user's active cart
    assert.ok(updateCartPaymentInvoice?._id);
  });

  test('admin: return error when order payment provider type is not INVOICE', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartPaymentInvoice($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
          updateCartPaymentInvoice(
            orderId: $orderId
            paymentProviderId: $paymentProviderId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: GenericPaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });

    assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
      orderId: SimpleOrder._id,
      code: 'OrderPaymentTypeError',
      received: 'GENERIC',
      required: 'INVOICE',
    });
  });

  test('user: update order payment (invoice & card)', async () => {
    const { data: { updateCartPaymentInvoice } = {} } = await graphqlFetchAsNormalUser({
      query: /* GraphQL */ `
        mutation updateCartPaymentInvoice($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
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
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: SimplePaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });

    assert.partialDeepStrictEqual(updateCartPaymentInvoice, {
      _id: SimpleOrder._id,
      payment: {
        _id: SimplePayment._id,
        provider: {
          type: 'INVOICE',
        },
      },
    });
  });

  test('anonymous: return NoPermissionError', async () => {
    const { errors } = await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        mutation updateCartPaymentInvoice($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
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
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: SimplePaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });

    assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });

  test('admin: update order payment successfully when order payment provider type is generic', async () => {
    const { data: { updateCartPaymentGeneric } = {} } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartPaymentGeneric($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
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
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: GenericPaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(updateCartPaymentGeneric, {
      _id: SimpleOrder._id,
      payment: {
        _id: GenericPayment._id,
        provider: {
          type: 'GENERIC',
        },
      },
    });
  });

  test('admin: return error when order payment type is not GENERIC', async () => {
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation updateCartPaymentGeneric($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
          updateCartPaymentGeneric(
            orderId: $orderId
            paymentProviderId: $paymentProviderId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: SimplePaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
      orderId: SimpleOrder._id,
      code: 'OrderPaymentTypeError',
      received: 'INVOICE',
      required: 'GENERIC',
    });
  });

  test('user: update order payment successfully when order payment provider type is generic', async () => {
    const { data: { updateCartPaymentGeneric } = {} } = await graphqlFetchAsNormalUser({
      query: /* GraphQL */ `
        mutation updateCartPaymentGeneric($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
          updateCartPaymentGeneric(
            orderId: $orderId
            paymentProviderId: $paymentProviderId
            meta: $meta
          ) {
            _id
            payment {
              _id
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: GenericPaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });
    assert.partialDeepStrictEqual(updateCartPaymentGeneric, {
      _id: SimpleOrder._id,
      payment: {
        _id: GenericPayment._id,
      },
    });
  });

  test('anonymous: return NoPermissionError', async () => {
    const { errors } = await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        mutation updateCartPaymentGeneric($orderId: ID!, $paymentProviderId: ID!, $meta: JSON) {
          updateCartPaymentGeneric(
            orderId: $orderId
            paymentProviderId: $paymentProviderId
            meta: $meta
          ) {
            _id
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
        paymentProviderId: GenericPaymentProvider._id,
        meta: {
          john: 'wayne',
        },
      },
    });

    assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
      code: 'NoPermissionError',
    });
  });
});
