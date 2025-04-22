import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { SimpleOrder } from './seeds/orders.js';
import { USER_TOKEN } from './seeds/users.js';
import { ProposedQuotation } from './seeds/quotations.js';
import { SimpleProduct } from './seeds/products.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;

test.describe('Cart: Quotations', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.addCartQuotation', () => {
    test('add quotation to the cart', async () => {
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
                currencyCode
              }
              total {
                amount
                currencyCode
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
      assert.partialDeepStrictEqual(addCartQuotation, {
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

    test('return quantity low error when provided quantity that is less than 1', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartQuotation($orderId: ID, $quotationId: ID!, $quantity: Int) {
            addCartQuotation(orderId: $orderId, quotationId: $quotationId, quantity: $quantity) {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'OrderQuantityTooLowError');
    });

    test('return not found error when non existing quotation Id is provided', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'QuotationNotFoundError');
    });

    test('return error when invalid quotation Id is provided', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
