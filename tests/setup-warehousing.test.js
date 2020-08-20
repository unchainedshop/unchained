import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleWarehousingProvider } from './seeds/warehousings';

describe('setup warehousing providers', () => {
  let connection;
  let graphqlFetch;

  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createWarehousingProvider', () => {
    it('add a shipping warehousing provider', async () => {
      const {
        data: { createWarehousingProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createWarehousingProvider(
            $warehousingProvider: CreateProviderInput!
          ) {
            createWarehousingProvider(
              warehousingProvider: $warehousingProvider
            ) {
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
            adapterKey: 'shop.unchained.warehousing.google-sheets',
          },
        },
      });
      expect(errors).toEqual(undefined);
      expect(createWarehousingProvider).toMatchObject({
        configurationError: null,
        deleted: null,
        interface: {
          _id: 'shop.unchained.warehousing.google-sheets',
        },
        type: 'PHYSICAL',
      });
    });
  });

  describe('Mutation.updateWarehousingProvider', () => {
    it('Update a warehousing provider', async () => {
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
      expect(errors).toEqual(undefined);
      expect(updateWarehousingProvider).toMatchObject({
        configuration: [
          {
            key: 'gugus',
            value: 'blub',
          },
        ],
        configurationError: null,
        deleted: null,
        interface: {
          _id: 'shop.unchained.warehousing.google-sheets',
        },
        type: 'PHYSICAL',
      });
    });
  });

  describe('Mutation.removeWarehousingProvider', () => {
    it('Remove a warehousing provider', async () => {
      const {
        data: { removeWarehousingProvider, errors },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeWarehousingProvider($warehousingProviderId: ID!) {
            removeWarehousingProvider(
              warehousingProviderId: $warehousingProviderId
            ) {
              _id
              deleted
            }
          }
        `,
        variables: {
          warehousingProviderId: SimpleWarehousingProvider._id,
        },
      });
      expect(errors).toEqual(undefined);
      expect(removeWarehousingProvider).toMatchObject({
        deleted: expect.anything(),
        _id: SimpleWarehousingProvider._id,
      });
    });

    it('return not found error when passed non existing warehouseProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeWarehousingProvider($warehousingProviderId: ID!) {
            removeWarehousingProvider(
              warehousingProviderId: $warehousingProviderId
            ) {
              _id
              deleted
            }
          }
        `,
        variables: {
          warehousingProviderId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual(
        'WarehousingProviderNotFoundError',
      );
    });

    it('return error when passed invalid warehouseProviderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeWarehousingProvider($warehousingProviderId: ID!) {
            removeWarehousingProvider(
              warehousingProviderId: $warehousingProviderId
            ) {
              _id
              deleted
            }
          }
        `,
        variables: {
          warehousingProviderId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
