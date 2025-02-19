import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimpleDeliveryProvider } from './seeds/deliveries.js';

describe('setup delivery providers', () => {
  let graphqlFetch;

  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  describe('Mutation.createDeliveryProvider', () => {
    it('create a shipping delivery provider', async () => {
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
      expect(errors).toEqual(undefined);
      expect(createDeliveryProvider).toMatchObject({
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

  describe('Mutation.updateDeliveryProvider', () => {
    it('Update a delivery provider', async () => {
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
      expect(errors).toEqual(undefined);
      expect(updateDeliveryProvider).toMatchObject({
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

    it('return not found error when passed non existing deliveryProviderId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('DeliverProviderNotFoundError');
    });

    it('return error when passed invalid deliveryProviderId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.removeDeliveryProvider', () => {
    it('Remove a delivery provider', async () => {
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
      expect(errors).toEqual(undefined);
      expect(removeDeliveryProvider).toMatchObject({
        deleted: expect.anything(),
        _id: SimpleDeliveryProvider._id,
      });
    });

    it('return not found error when passed non existing deliveryProviderId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('DeliverProviderNotFoundError');
    });

    it('return error when passed invalid deliveryProviderId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
