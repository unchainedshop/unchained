import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';
import { ProcessingQuotation } from './seeds/quotations';

import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users';

let connection;
let graphqlFetch;
let adminGraphqlFetch;

describe('cart checkout', () => {
  let quotationId;

  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.requestQuotation', () => {
    it('request a new quotation for a product', async () => {
      const { data: { requestQuotation } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation requestQuotation(
            $productId: ID!
            $configuration: [ProductConfigurationParameterInput!]
          ) {
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
      expect(requestQuotation).toMatchObject({
        user: {},
        product: {},
        status: 'REQUESTED',
        updated: null,
        isExpired: false,
        quotationNumber: null,
        fullfilled: null,
        rejected: null,
        country: {},
        currency: {},
        meta: null,
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
        documents: [],
      });
    });

    it('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation requestQuotation(
            $productId: ID!
            $configuration: [ProductConfigurationParameterInput!]
          ) {
            requestQuotation(
              productId: $productId
              configuration: $configuration
            ) {
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

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation requestQuotation(
            $productId: ID!
            $configuration: [ProductConfigurationParameterInput!]
          ) {
            requestQuotation(
              productId: $productId
              configuration: $configuration
            ) {
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.verifyQuotation', () => {
    it('verify the quotation as admin', async () => {
      const { data: { verifyQuotation } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation verifyQuotation($quotationId: ID!, $quotationContext: JSON) {
            verifyQuotation(
              quotationId: $quotationId
              quotationContext: $quotationContext
            ) {
              _id
              status
              created
              updated
              isExpired
              quotationNumber
              fullfilled
              rejected
              meta
              documents {
                _id
                type
                url
              }
            }
          }
        `,
        variables: {
          quotationId,
          quotationContext: { hello: 'world' },
        },
      });
      expect(verifyQuotation).toMatchObject({
        status: 'PROCESSING',
        isExpired: false,
        fullfilled: null,
        rejected: null,
        meta: null,
        documents: [],
      });
    });
  });

  describe('Mutation.rejectQuotation', () => {
    it('reject the quotation as admin', async () => {
      const { data: { rejectQuotation } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation rejectQuotation($quotationId: ID!, $quotationContext: JSON) {
            rejectQuotation(
              quotationId: $quotationId
              quotationContext: $quotationContext
            ) {
              _id
              status
              created
              updated
              isExpired
              quotationNumber
              fullfilled
              rejected
              meta
              documents {
                _id
                type
                url
              }
            }
          }
        `,
        variables: {
          quotationId,
          quotationContext: { hello: 'no world' },
        },
      });
      expect(rejectQuotation.rejected).toBeTruthy();
      expect(rejectQuotation).toMatchObject({
        status: 'REJECTED',
        isExpired: true,
        fullfilled: null,
        meta: null,
        documents: [],
      });
    });

    it('return not found when passed non existing quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation rejectQuotation($quotationId: ID!, $quotationContext: JSON) {
            rejectQuotation(
              quotationId: $quotationId
              quotationContext: $quotationContext
            ) {
              _id
            }
          }
        `,
        variables: {
          quotationId: 'non-existing-id',
          quotationContext: { hello: 'no world' },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('QuotationNotFoundError');
    });

    it('return error when passed invalid quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation rejectQuotation($quotationId: ID!, $quotationContext: JSON) {
            rejectQuotation(
              quotationId: $quotationId
              quotationContext: $quotationContext
            ) {
              _id
            }
          }
        `,
        variables: {
          quotationId: '',
          quotationContext: { hello: 'no world' },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.makeQuotationProposal', () => {
    it('answer the quotation as admin', async () => {
      const { data: { makeQuotationProposal } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation makeQuotationProposal(
            $quotationId: ID!
            $quotationContext: JSON
          ) {
            makeQuotationProposal(
              quotationId: $quotationId
              quotationContext: $quotationContext
            ) {
              _id
              status
              created
              updated
              isExpired
              quotationNumber
              fullfilled
              rejected
              meta
              documents {
                _id
                type
                url
              }
            }
          }
        `,
        variables: {
          quotationId: ProcessingQuotation._id,
          quotationContext: { hello: 'car' },
        },
      });
      expect(makeQuotationProposal).toMatchObject({
        status: 'PROPOSED',
        isExpired: true,
        fullfilled: null,
        rejected: null,
        meta: null,
        documents: [],
      });
    });

    it('return not found error when passed non existing quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation makeQuotationProposal(
            $quotationId: ID!
            $quotationContext: JSON
          ) {
            makeQuotationProposal(
              quotationId: $quotationId
              quotationContext: $quotationContext
            ) {
              _id
            }
          }
        `,
        variables: {
          quotationId: 'invalid-id',
          quotationContext: { hello: 'car' },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('QuotationNotFoundError');
    });

    it('return error when passed invalid quotationId', async () => {
      const { errors } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          mutation makeQuotationProposal(
            $quotationId: ID!
            $quotationContext: JSON
          ) {
            makeQuotationProposal(
              quotationId: $quotationId
              quotationContext: $quotationContext
            ) {
              _id
            }
          }
        `,
        variables: {
          quotationId: '',
          quotationContext: { hello: 'car' },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
