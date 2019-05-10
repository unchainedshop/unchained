import { setupDatabase, createAdminApolloFetch } from './helpers';

describe('setup payment providers', () => {
  let PaymentProviders;
  let connection;
  let db;
  let apolloFetch;

  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    apolloFetch = await createAdminApolloFetch();
    PaymentProviders = db.collection('payment-providers');
  });

  afterAll(async () => {
    await connection.close();
  });

  it('add an invoice payment provider', async () => {
    const {
      data: { createPaymentProvider, errors }
    } = await apolloFetch({
      query: /* GraphQL */ `
        mutation createPaymentProvider($paymentProvider: CreateProviderInput!) {
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
          adapterKey: 'shop.unchained.invoice'
        }
      }
    });
    expect(errors).toEqual(undefined);
    expect(createPaymentProvider).toMatchObject({
      configuration: [],
      configurationError: null,
      deleted: null,
      interface: {
        _id: 'shop.unchained.invoice'
      },
      type: 'INVOICE'
    });
    expect(await PaymentProviders.countDocuments()).toEqual(1);
  });
});
