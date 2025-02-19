import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('setup payment providers', () => {
  let graphqlFetch;

  test.beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  test.describe('Mutation.createPaymentProvider', () => {
    test('Add an invoice payment provider', async () => {
      const {
        data: { createPaymentProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createPaymentProvider($paymentProvider: CreatePaymentProviderInput!) {
            createPaymentProvider(paymentProvider: $paymentProvider) {
              _id
              created
              updated
              deleted
              type
              interface {
                _id
                version
                label
              }
              configuration
              configurationError
            }
          }
        `,
        variables: {
          paymentProvider: {
            type: 'INVOICE',
            adapterKey: 'shop.unchained.invoice',
          },
        },
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(createPaymentProvider, {
        configuration: [],
        configurationError: null,
        deleted: null,
        interface: {
          _id: 'shop.unchained.invoice',
        },
        type: 'INVOICE',
      });
    });
  });

  test.describe('Mutation.updatePaymentProvider', () => {
    test('Update a payment provider', async () => {
      const {
        data: { updatePaymentProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updatePaymentProvider(
            $paymentProvider: UpdateProviderInput!
            $paymentProviderId: ID!
          ) {
            updatePaymentProvider(
              paymentProvider: $paymentProvider
              paymentProviderId: $paymentProviderId
            ) {
              _id
              type
              deleted
              interface {
                _id
              }
              configuration
              configurationError
            }
          }
        `,
        variables: {
          paymentProviderId: SimplePaymentProvider._id,
          paymentProvider: {
            configuration: [
              {
                key: 'gugus',
                value: 'blub',
              },
            ],
          },
        },
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(updatePaymentProvider, {
        configuration: [
          {
            key: 'gugus',
            value: 'blub',
          },
        ],
        configurationError: null,
        deleted: null,
        interface: {
          _id: 'shop.unchained.invoice',
        },
        type: 'INVOICE',
      });
    });

    test('return not found error when passed non existing paymentProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updatePaymentProvider(
            $paymentProvider: UpdateProviderInput!
            $paymentProviderId: ID!
          ) {
            updatePaymentProvider(
              paymentProvider: $paymentProvider
              paymentProviderId: $paymentProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          paymentProviderId: 'non-existing-id',
          paymentProvider: {
            configuration: [
              {
                key: 'gugus',
                value: 'blub',
              },
            ],
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'PaymentProviderNotFoundError');
    });

    test('return error when passed invalid paymentProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updatePaymentProvider(
            $paymentProvider: UpdateProviderInput!
            $paymentProviderId: ID!
          ) {
            updatePaymentProvider(
              paymentProvider: $paymentProvider
              paymentProviderId: $paymentProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          paymentProviderId: '',
          paymentProvider: {
            configuration: [
              {
                key: 'gugus',
                value: 'blub',
              },
            ],
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.removePaymentProvider', () => {
    test('Remove a payment provider', async () => {
      const {
        data: { removePaymentProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removePaymentProvider($paymentProviderId: ID!) {
            removePaymentProvider(paymentProviderId: $paymentProviderId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          paymentProviderId: SimplePaymentProvider._id,
        },
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(removePaymentProvider, {
        deleted: expect.anything(),
        _id: SimplePaymentProvider._id,
      });
    });

    test('return not found error when passed non existing paymentProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removePaymentProvider($paymentProviderId: ID!) {
            removePaymentProvider(paymentProviderId: $paymentProviderId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          paymentProviderId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'PaymentProviderNotFoundError');
    });

    test('return error when passed invalid paymentProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removePaymentProvider($paymentProviderId: ID!) {
            removePaymentProvider(paymentProviderId: $paymentProviderId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          paymentProviderId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
