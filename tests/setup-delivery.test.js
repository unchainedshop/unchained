import { setupDatabase, createAdminGraphqlFetch } from './helpers';

describe('setup delivery providers', () => {
  let DeliveryProviders;
  let connection;
  let db;
  let graphqlFetch;

  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createAdminGraphqlFetch();
    DeliveryProviders = db.collection('delivery-providers');
  });

  afterAll(async () => {
    await connection.close();
  });

  it('add a shipping delivery provider', async () => {
    const {
      data: { createDeliveryProvider, errors }
    } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation createDeliveryProvider(
          $deliveryProvider: CreateProviderInput!
        ) {
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
          adapterKey: 'shop.unchained.send-mail'
        }
      }
    });
    expect(errors).toEqual(undefined);
    expect(createDeliveryProvider).toMatchObject({
      configurationError: null,
      deleted: null,
      interface: {
        _id: 'shop.unchained.send-mail'
      },
      type: 'SHIPPING'
    });
    expect(await DeliveryProviders.countDocuments()).toEqual(1);
  });
});
