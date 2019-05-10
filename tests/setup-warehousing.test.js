import { setupDatabase, createAdminApolloFetch } from './helpers';

describe('setup warehousing providers', () => {
  let WarehousingProviders;
  let connection;
  let db;
  let apolloFetch;

  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    apolloFetch = await createAdminApolloFetch();
    WarehousingProviders = db.collection('warehousing-providers');
  });

  afterAll(async () => {
    await connection.close();
  });

  it('add a shipping warehousing provider', async () => {
    const {
      data: { createWarehousingProvider, errors }
    } = await apolloFetch({
      query: /* GraphQL */ `
        mutation createWarehousingProvider(
          $warehousingProvider: CreateProviderInput!
        ) {
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
          adapterKey: 'shop.unchained.warehousing.google-sheets'
        }
      }
    });
    expect(errors).toEqual(undefined);
    expect(createWarehousingProvider).toMatchObject({
      configurationError: null,
      deleted: null,
      interface: {
        _id: 'shop.unchained.warehousing.google-sheets'
      },
      type: 'PHYSICAL'
    });
    expect(await WarehousingProviders.countDocuments()).toEqual(1);
  });
});
