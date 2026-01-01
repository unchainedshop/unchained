import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { SimpleOrder, ConfirmedOrder, PendingOrder, PendingOrder2 } from './seeds/orders.js';

test.describe('Order: Transaction / Management', () => {
  let graphqlFetch;

  test.before(async () => {
    const { createLoggedInGraphqlFetch } = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test('cannot remove an already submitted order', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation removeOrder($orderId: ID!) {
          removeOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: ConfirmedOrder._id,
      },
    });
    assert.strictEqual(errors[0].extensions?.code, 'OrderWrongStatusError');
  });

  test('remove a cart', async () => {
    const { data: { removeOrder } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation removeOrder($orderId: ID!) {
          removeOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
      },
    });
    assert.deepStrictEqual(removeOrder, {
      _id: SimpleOrder._id,
      status: 'OPEN',
    });
  });

  test('return not found error when passed non existing orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation removeOrder($orderId: ID!) {
          removeOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: 'non-existing-id',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
  });

  test('return error when passed invalid orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation removeOrder($orderId: ID!) {
          removeOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: '',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });

  test('cannot confirm an already confirmed order', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation confirmOrder($orderId: ID!) {
          confirmOrder(orderId: $orderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: ConfirmedOrder._id,
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderWrongStatusError');
  });

  test('confirm a pending order', async () => {
    const { data: { confirmOrder } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation confirmOrder($orderId: ID!) {
          confirmOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: PendingOrder._id,
      },
    });
    assert.deepStrictEqual(confirmOrder, {
      _id: PendingOrder._id,
      status: 'CONFIRMED',
    });
  });

  test('return not found error when passed non existing orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation confirmOrder($orderId: ID!) {
          confirmOrder(orderId: $orderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: 'non-existing-id',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
  });

  test('return error when passed invalid orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation confirmOrder($orderId: ID!) {
          confirmOrder(orderId: $orderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: '',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });

  test('cannot reject an already confirmed order', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation rejectOrder($orderId: ID!) {
          rejectOrder(orderId: $orderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: ConfirmedOrder._id,
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderWrongStatusError');
  });

  test('reject a pending order', async () => {
    const result = await graphqlFetch({
      query: /* GraphQL */ `
        mutation rejectOrder($orderId: ID!) {
          rejectOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: PendingOrder2._id,
      },
    });
    const { data: { rejectOrder } = {} } = result;
    assert.partialDeepStrictEqual(rejectOrder, {
      _id: PendingOrder2._id,
      status: 'REJECTED',
    });
  });

  test('return not found error when passed non existing orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation rejectOrder($orderId: ID!) {
          rejectOrder(orderId: $orderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: 'non-existing-id',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
  });

  test('pay a confirmed order', async () => {
    const { data: { payOrder } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation payOrder($orderId: ID!) {
          payOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: ConfirmedOrder._id,
      },
    });
    assert.deepStrictEqual(payOrder, {
      _id: ConfirmedOrder._id,
      status: 'CONFIRMED',
    });
  });

  test('return not found error when passed non existing orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation payOrder($orderId: ID!) {
          payOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: 'invalid-id',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
  });

  test('return error when passed invalid orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation payOrder($orderId: ID!) {
          payOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: '',
      },
    });

    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });

  test('deliver a confirmed order -> leads to fulfilled', async () => {
    const { data: { deliverOrder } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation deliverOrder($orderId: ID!) {
          deliverOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: ConfirmedOrder._id,
      },
    });
    assert.deepStrictEqual(deliverOrder, {
      _id: ConfirmedOrder._id,
      status: 'FULFILLED',
    });
  });

  test('return not found error when passed non existing orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation deliverOrder($orderId: ID!) {
          deliverOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: 'non-existing-id',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'OrderNotFoundError');
  });

  test('return error when passed invalid orderId', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation deliverOrder($orderId: ID!) {
          deliverOrder(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: {
        orderId: '',
      },
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });
});
