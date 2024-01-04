import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimplePaymentProvider } from './seeds/payments.js';

describe('setup payment providers', () => {
  let graphqlFetch;

  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  describe('Mutation.createPaymentProvider', () => {
    it('Add an invoice payment provider', async () => {
      const {
        data: { createPaymentProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createPaymentProvider(
            $paymentProvider: CreatePaymentProviderInput!
          ) {
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
      expect(errors).toEqual(undefined);
      expect(createPaymentProvider).toMatchObject({
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

  describe('Mutation.updatePaymentProvider', () => {
    it('Update a payment provider', async () => {
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
      expect(errors).toEqual(undefined);
      expect(updatePaymentProvider).toMatchObject({
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

    it('return not found error when passed non existing paymentProviderId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual(
        'PaymentProviderNotFoundError',
      );
    });

    it('return error when passed invalid paymentProviderId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.removePaymentProvider', () => {
    it('Remove a payment provider', async () => {
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
      expect(errors).toEqual(undefined);
      expect(removePaymentProvider).toMatchObject({
        deleted: expect.anything(),
        _id: SimplePaymentProvider._id,
      });
    });

    it('return not found error when passed non existing paymentProviderId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual(
        'PaymentProviderNotFoundError',
      );
    });

    it('return error when passed invalid paymentProviderId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
