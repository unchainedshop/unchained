import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimpleOrder } from './seeds/orders.js';
import { USER_TOKEN } from './seeds/users.js';
import { ProposedQuotation } from './seeds/quotations.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetch;

describe('Cart: Quotations', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
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
                _id
                amount
                currency
              }
              total {
                _id
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
          quotationId: ProposedQuotation._id,
        },
      });
      expect(addCartQuotation).toMatchObject({
        product: { _id: SimpleProduct._id },
        order: { _id: SimpleOrder._id },
        quantity: 1,
        originalProduct: { _id: SimpleProduct._id },
        quotation: { _id: ProposedQuotation._id },
        unitPrice: {},
        total: {},
        configuration: null,
      });
    });

    it('return quantity low error when provided quantity that is less than 1', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartQuotation(
            $orderId: ID
            $quotationId: ID!
            $quantity: Int
          ) {
            addCartQuotation(
              orderId: $orderId
              quotationId: $quotationId
              quantity: $quantity
            ) {
              _id
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          quotationId: ProposedQuotation._id,
          quantity: 0,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderQuantityTooLowError');
    });

    it('return not found error when non existing quotation Id is provided', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartQuotation($orderId: ID, $quotationId: ID!) {
            addCartQuotation(orderId: $orderId, quotationId: $quotationId) {
              _id
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          quotationId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('QuotationNotFoundError');
    });

    it('return error when invalid quotation Id is provided', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartQuotation($orderId: ID, $quotationId: ID!) {
            addCartQuotation(orderId: $orderId, quotationId: $quotationId) {
              _id
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          quotationId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
