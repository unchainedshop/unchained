import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { ProposedQuotation } from './seeds/quotations';

let connection;
let graphqlFetch;

describe('TranslatedFilterTexts', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });
  describe('Query.quotations for admin should', () => {
    it('return list of quotations', async () => {
      const {
        data: { quotations },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Quotations($limit: Int = 10, $offset: Int = 0) {
            quotations(limit: $limit, offset: $offset) {
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
              meta
              configuration {
                key
                value
              }
              documents {
                _id
              }
              logs {
                _id
                created
                level
                message
                user {
                  _id
                }
                order {
                  _id
                }
              }
            }
          }
        `,
        variables: {},
      });
      expect(quotations.length).toEqual(2);
    });
  });

  describe('Query.quotations for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
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
      expect(errors.length).toEqual(1);
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
              meta
              configuration {
                key
                value
              }
              documents {
                _id
              }
              logs {
                _id
                created
                level
                message
                user {
                  _id
                }
                order {
                  _id
                }
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
