import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { PrePaidPaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePayment, GenericPayment } from './seeds/orders.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

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
  const { data: { setOrderPaymentProvider } = {} } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      mutation setOrderPaymentProvider($orderId: ID!, $paymentProviderId: ID!) {
        setOrderPaymentProvider(orderId: $orderId, paymentProviderId: $paymentProviderId) {
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
  assert.partialDeepStrictEqual(setOrderPaymentProvider, {
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
      mutation setOrderPaymentProvider($orderId: ID!, $paymentProviderId: ID!) {
        setOrderPaymentProvider(orderId: $orderId, paymentProviderId: $paymentProviderId) {
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
      mutation setOrderPaymentProvider($orderId: ID!, $paymentProviderId: ID!) {
        setOrderPaymentProvider(orderId: $orderId, paymentProviderId: $paymentProviderId) {
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
      mutation setOrderPaymentProvider($orderId: ID!, $paymentProviderId: ID!) {
        setOrderPaymentProvider(orderId: $orderId, paymentProviderId: $paymentProviderId) {
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
  const { data: { setOrderPaymentProvider } = {} } = await graphqlFetchAsNormalUser({
    query: /* GraphQL */ `
      mutation setOrderPaymentProvider($orderId: ID!, $paymentProviderId: ID!) {
        setOrderPaymentProvider(orderId: $orderId, paymentProviderId: $paymentProviderId) {
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
  assert.partialDeepStrictEqual(setOrderPaymentProvider, {
    _id: SimpleOrder._id,
    payment: {
      provider: { _id: PrePaidPaymentProvider._id },
    },
  });
});

test('anonymous: return NoPermissionError', async () => {
  const { errors } = await graphqlFetchAsAnonymousUser({
    query: /* GraphQL */ `
      mutation setOrderPaymentProvider($orderId: ID!, $paymentProviderId: ID!) {
        setOrderPaymentProvider(orderId: $orderId, paymentProviderId: $paymentProviderId) {
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
  const { data: { updateOrderPaymentInvoice } = {} } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      mutation updateOrderPaymentInvoice($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentInvoice(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
          provider {
            _id
            type
          }
        }
      }
    `,
    variables: {
      orderPaymentId: SimplePayment._id,
      meta: {
        john: 'wayne',
      },
    },
  });

  assert.partialDeepStrictEqual(updateOrderPaymentInvoice, {
    _id: SimplePayment._id,
    provider: {
      type: 'INVOICE',
    },
  });
});

test('admin: return not found error when passed non existing order payment ID', async () => {
  const { errors } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      mutation updateOrderPaymentInvoice($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentInvoice(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
        }
      }
    `,
    variables: {
      orderPaymentId: 'non-existing-id',
      meta: {
        john: 'wayne',
      },
    },
  });

  assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
    code: 'OrderPaymentNotFoundError',
  });
});

test('admin: return invalid ID error when passed invalid order payment ID', async () => {
  const { errors } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      mutation updateOrderPaymentInvoice($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentInvoice(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
        }
      }
    `,
    variables: {
      orderPaymentId: '',
      meta: {
        john: 'wayne',
      },
    },
  });

  assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
    code: 'InvalidIdError',
  });
});

test('admin: return error when order payment provider type is not INVOICE', async () => {
  const { errors } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      mutation updateOrderPaymentInvoice($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentInvoice(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
        }
      }
    `,
    variables: {
      orderPaymentId: GenericPayment._id,
      meta: {
        john: 'wayne',
      },
    },
  });

  assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
    orderPaymentId: GenericPayment._id,
    code: 'OrderPaymentTypeError',
    received: 'GENERIC',
    required: 'INVOICE',
  });
});

test('user: update order payment (invoice & card)', async () => {
  const { data: { updateOrderPaymentInvoice } = {} } = await graphqlFetchAsNormalUser({
    query: /* GraphQL */ `
      mutation updateOrderPaymentInvoice($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentInvoice(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
          provider {
            _id
            type
          }
        }
      }
    `,
    variables: {
      orderPaymentId: SimplePayment._id,
      meta: {
        john: 'wayne',
      },
    },
  });

  assert.partialDeepStrictEqual(updateOrderPaymentInvoice, {
    _id: SimplePayment._id,
    provider: {
      type: 'INVOICE',
    },
  });
});

test('anonymous: return NoPermissionError', async () => {
  const { errors } = await graphqlFetchAsAnonymousUser({
    query: /* GraphQL */ `
      mutation updateOrderPaymentInvoice($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentInvoice(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
          provider {
            _id
            type
          }
        }
      }
    `,
    variables: {
      orderPaymentId: SimplePayment._id,
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
  const { data: { updateOrderPaymentGeneric } = {} } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      mutation updateOrderPaymentGeneric($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentGeneric(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
          provider {
            _id
            type
          }
        }
      }
    `,
    variables: {
      orderPaymentId: GenericPayment._id,
      meta: {
        john: 'wayne',
      },
    },
  });
  assert.partialDeepStrictEqual(updateOrderPaymentGeneric, {
    _id: GenericPayment._id,
    provider: {
      type: 'GENERIC',
    },
  });
});

test('admin: return error when order payment type is not GENERIC', async () => {
  const { errors } = await graphqlFetchAsAdmin({
    query: /* GraphQL */ `
      mutation updateOrderPaymentGeneric($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentGeneric(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
        }
      }
    `,
    variables: {
      orderPaymentId: SimplePayment._id,
      meta: {
        john: 'wayne',
      },
    },
  });
  assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
    orderPaymentId: SimplePayment._id,
    code: 'OrderPaymentTypeError',
    received: 'INVOICE',
    required: 'GENERIC',
  });
});

test('user: update order payment successfully when order payment provider type is generic', async () => {
  const { data: { updateOrderPaymentGeneric } = {} } = await graphqlFetchAsNormalUser({
    query: /* GraphQL */ `
      mutation updateOrderPaymentGeneric($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentGeneric(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
        }
      }
    `,
    variables: {
      orderPaymentId: GenericPayment._id,
      meta: {
        john: 'wayne',
      },
    },
  });
  assert.partialDeepStrictEqual(updateOrderPaymentGeneric, {
    _id: GenericPayment._id,
  });
});

test('anonymous: return NoPermissionError', async () => {
  const { errors } = await graphqlFetchAsAnonymousUser({
    query: /* GraphQL */ `
      mutation updateOrderPaymentGeneric($orderPaymentId: ID!, $meta: JSON) {
        updateOrderPaymentGeneric(orderPaymentId: $orderPaymentId, meta: $meta) {
          _id
        }
      }
    `,
    variables: {
      orderPaymentId: GenericPayment._id,
      meta: {
        john: 'wayne',
      },
    },
  });

  assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
    code: 'NoPermissionError',
  });
});

test.todo('Mutation.updateOrderPaymentCard', () => {});
