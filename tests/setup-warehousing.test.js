import { test, before, describe } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimpleWarehousingProvider } from './seeds/warehousings.js';

let graphqlFetch;

describe('setup warehousing providers', async () => {
  before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  describe('Mutation.createWarehousingProvider', async () => {
    test('add a shipping warehousing provider', async () => {
      const {
        data: { createWarehousingProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createWarehousingProvider($warehousingProvider: CreateWarehousingProviderInput!) {
            createWarehousingProvider(warehousingProvider: $warehousingProvider) {
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
          warehousingProvider: {
            type: 'PHYSICAL',
            adapterKey: 'shop.unchained.warehousing.store',
          },
        },
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(createWarehousingProvider, {
        configurationError: null,
        deleted: null,
        interface: {
          _id: 'shop.unchained.warehousing.store',
        },
        type: 'PHYSICAL',
      });
    });
  });

  describe('Mutation.updateWarehousingProvider', async () => {
    test('Update a warehousing provider', async () => {
      const {
        data: { updateWarehousingProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateWarehousingProvider(
            $warehousingProvider: UpdateProviderInput!
            $warehousingProviderId: ID!
          ) {
            updateWarehousingProvider(
              warehousingProvider: $warehousingProvider
              warehousingProviderId: $warehousingProviderId
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
          warehousingProviderId: SimpleWarehousingProvider._id,
          warehousingProvider: {
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
      assert.deepStrictEqual(updateWarehousingProvider, {
        configuration: [
          {
            key: 'gugus',
            value: 'blub',
          },
        ],
        configurationError: null,
        deleted: null,
        interface: {
          _id: 'shop.unchained.warehousing.store',
        },
        type: 'PHYSICAL',
      });
    });

    test('return not found error when passed non existing warehousingProviderid', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateWarehousingProvider(
            $warehousingProvider: UpdateProviderInput!
            $warehousingProviderId: ID!
          ) {
            updateWarehousingProvider(
              warehousingProvider: $warehousingProvider
              warehousingProviderId: $warehousingProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          warehousingProviderId: 'non-existing-id',
          warehousingProvider: {
            configuration: [
              {
                key: 'gugus',
                value: 'blub',
              },
            ],
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'WarehousingProviderNotFoundError');
    });

    test('return error when passed invalid warehousingProviderid', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateWarehousingProvider(
            $warehousingProvider: UpdateProviderInput!
            $warehousingProviderId: ID!
          ) {
            updateWarehousingProvider(
              warehousingProvider: $warehousingProvider
              warehousingProviderId: $warehousingProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          warehousingProviderId: '',
          warehousingProvider: {
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

  describe('Mutation.removeWarehousingProvider', async () => {
    test('Remove a warehousing provider', async () => {
      const {
        data: { removeWarehousingProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeWarehousingProvider($warehousingProviderId: ID!) {
            removeWarehousingProvider(warehousingProviderId: $warehousingProviderId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          warehousingProviderId: SimpleWarehousingProvider._id,
        },
      });
      assert.strictEqual(errors, undefined);
      assert.partialDeepStrictEqual(removeWarehousingProvider, {
        _id: SimpleWarehousingProvider._id,
      });
    });

    test('return not found error when passed non existing warehouseProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeWarehousingProvider($warehousingProviderId: ID!) {
            removeWarehousingProvider(warehousingProviderId: $warehousingProviderId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          warehousingProviderId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'WarehousingProviderNotFoundError');
    });

    test('return error when passed invalid warehouseProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeWarehousingProvider($warehousingProviderId: ID!) {
            removeWarehousingProvider(warehousingProviderId: $warehousingProviderId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          warehousingProviderId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
