import { test } from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { ProcessingQuotation, ProposedQuotation } from './seeds/quotations.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetch;
let graphqlAnonymousFetch;

test.describe('Quotations', async () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlAnonymousFetch = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.quotations for admin should', async () => {
    test('return list of quotations', async () => {
      const {
        data: { quotations },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Quotations($limit: Int = 10, $offset: Int = 0) {
            quotations(limit: $limit, offset: $offset, sort: [{ key: "created", value: ASC }]) {
              _id
              user {
                _id
              }
              product {
                _id
              }
              status
              created
              expires
              updated
              isExpired
              quotationNumber
              fulfilled
              rejected
              country {
                _id
              }
              currency {
                _id
                isoCode
                isActive
              }
              configuration {
                key
                value
              }
            }
          }
        `,
        variables: {},
      });

      assert.equal(quotations.length, 2);
      assert.partialDeepStrictEqual(quotations[0], {
        quotationNumber: 'K271P03',
        status: 'PROCESSING',
        product: { _id: SimpleProduct._id },
      });
      assert.partialDeepStrictEqual(quotations[1], {
        quotationNumber: 'WGE9DLE7',
        status: 'PROPOSED',
        product: { _id: SimpleProduct._id },
      });
    });

    test('return list of searched quotations by quotation number', async () => {
      const {
        data: { quotations },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Quotations($queryString: String) {
            quotations(queryString: $queryString) {
              _id
              quotationNumber
            }
          }
        `,
        variables: {
          queryString: 'K271P03',
        },
      });
      assert.equal(quotations.length, 1);
      assert.deepStrictEqual(quotations, [
        {
          _id: ProcessingQuotation._id,
          quotationNumber: ProcessingQuotation.quotationNumber,
        },
      ]);
    });
  });

  test.describe('Query.quotations for anonymous user should', async () => {
    test('return error', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query Quotations($limit: Int = 10, $offset: Int = 0) {
            quotations(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {},
      });
      assert.equal(errors[0]?.extensions.code, 'NoPermissionError');
    });
  });

  test.describe('Query.quotationsCount for admin should', async () => {
    test('return total number of quotations', async () => {
      const {
        data: { quotationsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            quotationsCount
          }
        `,
        variables: {},
      });
      assert.equal(quotationsCount, 2);
    });
  });

  test.describe('Query.quotationsCount for anonymous user should', async () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query {
            quotationsCount
          }
        `,
        variables: {},
      });
      assert.equal(errors[0]?.extensions.code, 'NoPermissionError');
    });
  });

  test.describe('Query.quotation for admin user should', async () => {
    test('return single quotation when existing id passed', async () => {
      const {
        data: { quotation },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Quotation($quotationId: ID!) {
            quotation(quotationId: $quotationId) {
              _id
              user {
                _id
              }
              product {
                _id
              }
              status
              created
              expires
              updated
              isExpired
              quotationNumber
              fulfilled
              rejected
              country {
                _id
              }
              currency {
                _id
                isoCode
                isActive
              }
              configuration {
                key
                value
              }
            }
          }
        `,
        variables: {
          quotationId: ProposedQuotation._id,
        },
      });
      assert.equal(quotation._id, ProposedQuotation._id);
    });

    test('return error when invalid id ', async () => {
      const {
        data: { quotation },
        errors,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Quotation($quotationId: ID!) {
            quotation(quotationId: $quotationId) {
              _id
            }
          }
        `,
        variables: {
          quotationId: '',
        },
      });
      assert.equal(quotation, null);
      assert.equal(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
