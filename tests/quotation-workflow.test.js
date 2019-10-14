import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';
import { USER_TOKEN } from './seeds/users';

let connection;
let db;
let graphqlFetch;

describe('cart checkout', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.requestQuotation', () => {
    it('request a new quotation for a product', async () => {
      const { data: { requestQuotation } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation requestQuotation(productId: ID!, configuration: [ProductConfigurationParameterInput!]) {
            requestQuotation(
              productId: $productId
              configuration: $configuration
            ) {
              _id
              user {
                _id
                isInitialPassword
              }
              product {
                _id
              }
              status
              created
              updated
              isExpired
              quotationNumber
              fullfilled
              rejected
              country {
                isoCode
              }
              currency {
                isoCode
              }
              meta
              configuration {
                key
                value
              }
              documents {
                _id
                type
                url
              }
              logs {
                _id
                message
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          configuration: [
            { key: 'length', value: '5' },
            { key: 'height', value: '10' }
          ]
        }
      });
      console.log(requestQuotation);
      expect(requestQuotation).toMatchObject({
        user: {},
        product: {},
        status: 'REQUESTED',
        updated: null,
        isExpired: false,
        quotationNumber: null,
        fullfilled: null,
        rejected: null,
        country: null,
        currency: {
          isoCode: 'CHF'
        },
        meta: null,
        configuration: [
          {
            key: 'length',
            value: '5'
          },
          {
            key: 'height',
            value: '10'
          }
        ],
        documents: [],
        logs: []
      });
    });
  });
});
