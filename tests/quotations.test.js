import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { ProcessingQuotation, ProposedQuotation } from './seeds/quotations.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetch;
let graphqlAnonymousFetch;

describe('TranslatedFilterTexts', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
  });

  describe('Query.quotations for admin should', () => {
    it('return list of quotations', async () => {
      import.meta.jest.setTimeout(10000);
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
              fullfilled
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

      expect(quotations.length).toEqual(2);
      expect(quotations).toMatchObject([
        {
          quotationNumber: 'K271P03',
          status: 'PROCESSING',
          product: { _id: SimpleProduct._id },
        },
        {
          quotationNumber: 'WGE9DLE7',
          status: 'PROPOSED',
          product: { _id: SimpleProduct._id },
        },
      ]);
    });

    it('return list of searched quotations by quotation number', async () => {
      import.meta.jest.setTimeout(10000);
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
      expect(quotations.length).toEqual(1);
      expect(quotations).toMatchObject([
        {
          _id: ProcessingQuotation._id,
          quotationNumber: ProcessingQuotation.quotationNumber,
        },
      ]);
    });
  });

  describe('Query.quotations for anonymous user should', () => {
    it('return error', async () => {
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
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.quotationsCount for admin should', () => {
    it('return total number of quotations', async () => {
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
      expect(quotationsCount).toEqual(2);
    });
  });

  describe('Query.quotationsCount for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query {
            quotationsCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.quotation for admin user should', () => {
    it('return single quotation when existing id passed', async () => {
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
              fullfilled
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
      expect(quotation._id).toEqual(ProposedQuotation._id);
    });

    it('return error when invalid id ', async () => {
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
      expect(quotation).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
