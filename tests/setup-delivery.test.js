import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimpleDeliveryProvider } from './seeds/deliveries.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('setup delivery providers', () => {
  let graphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  test.describe('Mutation.createDeliveryProvider', () => {
    test('create a shipping delivery provider', async () => {
      const { data: { createDeliveryProvider, errors } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createDeliveryProvider($deliveryProvider: CreateDeliveryProviderInput!) {
            createDeliveryProvider(deliveryProvider: $deliveryProvider) {
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
          deliveryProvider: {
            type: 'SHIPPING',
            adapterKey: 'shop.unchained.post',
          },
        },
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(createDeliveryProvider, {
        configurationError: null,
        configuration: [],
        deleted: null,
        interface: {
          _id: 'shop.unchained.post',
        },
        type: 'SHIPPING',
      });
    });
  });

  test.describe('Mutation.updateDeliveryProvider', () => {
    test('Update a delivery provider', async () => {
      const {
        data: { updateDeliveryProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateDeliveryProvider(
            $deliveryProvider: UpdateProviderInput!
            $deliveryProviderId: ID!
          ) {
            updateDeliveryProvider(
              deliveryProvider: $deliveryProvider
              deliveryProviderId: $deliveryProviderId
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
          deliveryProviderId: SimpleDeliveryProvider._id,
          deliveryProvider: {
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
      assert.deepStrictEqual(updateDeliveryProvider, {
        configuration: [
          {
            key: 'gugus',
            value: 'blub',
          },
        ],
        configurationError: null,
        deleted: null,
        interface: {
          _id: 'shop.unchained.post',
        },
        type: 'SHIPPING',
      });
    });

    test('return not found error when passed non existing deliveryProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateDeliveryProvider(
            $deliveryProvider: UpdateProviderInput!
            $deliveryProviderId: ID!
          ) {
            updateDeliveryProvider(
              deliveryProvider: $deliveryProvider
              deliveryProviderId: $deliveryProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          deliveryProviderId: 'non-existing',
          deliveryProvider: {
            configuration: [
              {
                key: 'gugus',
                value: 'blub',
              },
            ],
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'DeliverProviderNotFoundError');
    });

    test('return error when passed invalid deliveryProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateDeliveryProvider(
            $deliveryProvider: UpdateProviderInput!
            $deliveryProviderId: ID!
          ) {
            updateDeliveryProvider(
              deliveryProvider: $deliveryProvider
              deliveryProviderId: $deliveryProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          deliveryProviderId: '',
          deliveryProvider: {
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

  test.describe('Mutation.removeDeliveryProvider', () => {
    test('Remove a delivery provider', async () => {
      const {
        data: { removeDeliveryProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeDeliveryProvider($deliveryProviderId: ID!) {
            removeDeliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          deliveryProviderId: SimpleDeliveryProvider._id,
        },
      });
      assert.strictEqual(errors, undefined);
      assert.ok(removeDeliveryProvider.deleted);
    });

    test('return not found error when passed non existing deliveryProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeDeliveryProvider($deliveryProviderId: ID!) {
            removeDeliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
            }
          }
        `,
        variables: {
          deliveryProviderId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'DeliverProviderNotFoundError');
    });

    test('return error when passed invalid deliveryProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeDeliveryProvider($deliveryProviderId: ID!) {
            removeDeliveryProvider(deliveryProviderId: $deliveryProviderId) {
              _id
            }
          }
        `,
        variables: {
          deliveryProviderId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
