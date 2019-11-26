import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleOrder } from './seeds/orders';
import { USER_TOKEN } from './seeds/users';
import { ProposedQuotation } from './seeds/quotations';

let connection;
let db; // eslint-disable-line
let graphqlFetch;

describe('Cart Quotations', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.addCartQuotation', () => {
    it('add quotation to the cart', async () => {
      const { data: { addCartQuotation } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartQuotation($orderId: ID, $quotationId: ID!) {
            addCartQuotation(orderId: $orderId, quotationId: $quotationId) {
              _id
              product {
                _id
              }
              order {
                _id
              }
              quantity
              originalProduct {
                _id
              }
              quotation {
                _id
              }
              unitPrice {
                amount
                currency
              }
              total {
                amount
                currency
              }
              configuration {
                key
                value
              }
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          quotationId: ProposedQuotation._id
        }
      });
      expect(addCartQuotation).toMatchObject({
        product: {},
        order: {},
        quantity: 1,
        originalProduct: {},
        quotation: {},
        unitPrice: {},
        total: {},
        configuration: null
      });
    });
  });
});
