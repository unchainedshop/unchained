import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { SimpleProduct } from './seeds/products.js';
import { ProcessingQuotation } from './seeds/quotations.js';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Quotation: Workflow', () => {
  let quotationId;
  let graphqlFetch;
  let adminGraphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.requestQuotation', () => {
    test('request a new quotation for a product', async () => {
      const { data: { requestQuotation } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation requestQuotation(
            $productId: ID!
            $configuration: [ProductConfigurationParameterInput!]
          ) {
            requestQuotation(productId: $productId, configuration: $configuration) {
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
              fulfilled
              rejected
              country {
                isoCode
              }
              currency {
                isoCode
              }
              configuration {
                key
                value
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          configuration: [
            { key: 'length', value: '5' },
            { key: 'height', value: '10' },
          ],
        },
      });
      quotationId = requestQuotation._id;
      assert.partialDeepStrictEqual(requestQuotation, {
        user: {},
        product: {},
        status: 'REQUESTED',
        updated: null,
        isExpired: false,
        quotationNumber: null,
        fulfilled: null,
        rejected: null,
        country: {},
        currency: {},
        configuration: [
          {
            key: 'length',
            value: '5',
          },
          {
            key: 'height',
            value: '10',
          },
        ],
      });
    });

    test('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation requestQuotation(
            $productId: ID!
            $configuration: [ProductConfigurationParameterInput!]
          ) {
            requestQuotation(productId: $productId, configuration: $configuration) {
              _id
            }
          }
        `,
        variables: {
          productId: 'non-existing-id',
          configuration: [
            { key: 'length', value: '5' },
            { key: 'height', value: '10' },
          ],
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation requestQuotation(
            $productId: ID!
            $configuration: [ProductConfigurationParameterInput!]
          ) {
            requestQuotation(productId: $productId, configuration: $configuration) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          configuration: [
            { key: 'length', value: '5' },
            { key: 'height', value: '10' },
          ],
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.verifyQuotation', () => {
    test('verify the quotation as admin', async () => {
      const { data: { verifyQuotation } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation verifyQuotation($quotationId: ID!, $quotationContext: JSON) {
            verifyQuotation(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
              status
              created
              updated
              isExpired
              quotationNumber
              fulfilled
              rejected
            }
          }
        `,
        variables: {
          quotationId,
          quotationContext: { hello: 'world' },
        },
      });
      assert.partialDeepStrictEqual(verifyQuotation, {
        status: 'PROCESSING',
        isExpired: false,
        fulfilled: null,
        rejected: null,
      });
    });

    test('return not found error when passed non existing quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation verifyQuotation($quotationId: ID!, $quotationContext: JSON) {
            verifyQuotation(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
            }
          }
        `,
        variables: {
          quotationId: 'non-existing-id',
          quotationContext: { hello: 'world' },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'QuotationNotFoundError');
    });

    test('return error when passed invalid quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation verifyQuotation($quotationId: ID!, $quotationContext: JSON) {
            verifyQuotation(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
            }
          }
        `,
        variables: {
          quotationId: '',
          quotationContext: { hello: 'world' },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.rejectQuotation', () => {
    test('reject the quotation as admin', async () => {
      const { data: { rejectQuotation } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation rejectQuotation($quotationId: ID!, $quotationContext: JSON) {
            rejectQuotation(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
              status
              created
              updated
              isExpired
              quotationNumber
              fulfilled
              rejected
            }
          }
        `,
        variables: {
          quotationId,
          quotationContext: { hello: 'no world' },
        },
      });
      assert.ok(rejectQuotation.rejected);
      assert.partialDeepStrictEqual(rejectQuotation, {
        status: 'REJECTED',
        isExpired: true,
        fulfilled: null,
      });
    });

    test('return not found when passed non existing quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation rejectQuotation($quotationId: ID!, $quotationContext: JSON) {
            rejectQuotation(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
            }
          }
        `,
        variables: {
          quotationId: 'non-existing-id',
          quotationContext: { hello: 'no world' },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'QuotationNotFoundError');
    });

    test('return error when passed invalid quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation rejectQuotation($quotationId: ID!, $quotationContext: JSON) {
            rejectQuotation(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
            }
          }
        `,
        variables: {
          quotationId: '',
          quotationContext: { hello: 'no world' },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.makeQuotationProposal', () => {
    test('answer the quotation as admin', async () => {
      const { data: { makeQuotationProposal } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation makeQuotationProposal($quotationId: ID!, $quotationContext: JSON) {
            makeQuotationProposal(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
              status
              created
              updated
              isExpired
              quotationNumber
              fulfilled
              rejected
            }
          }
        `,
        variables: {
          quotationId: ProcessingQuotation._id,
          quotationContext: { hello: 'car' },
        },
      });
      assert.partialDeepStrictEqual(makeQuotationProposal, {
        status: 'PROPOSED',
        isExpired: false,
        fulfilled: null,
        rejected: null,
      });
    });

    test('return not found error when passed non existing quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation makeQuotationProposal($quotationId: ID!, $quotationContext: JSON) {
            makeQuotationProposal(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
            }
          }
        `,
        variables: {
          quotationId: 'invalid-id',
          quotationContext: { hello: 'car' },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'QuotationNotFoundError');
    });

    test('return error when passed invalid quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation makeQuotationProposal($quotationId: ID!, $quotationContext: JSON) {
            makeQuotationProposal(quotationId: $quotationId, quotationContext: $quotationContext) {
              _id
            }
          }
        `,
        variables: {
          quotationId: '',
          quotationContext: { hello: 'car' },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
