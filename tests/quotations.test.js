import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { ProcessingQuotation, ProposedQuotation } from "./seeds/quotations";

let connection;
let graphqlFetch;

describe("TranslatedFilterTexts", () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });
  describe("Query.quotations for loged user should", () => {
    it("return list of quotations", async () => {
      const {
        data: { quotations },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Quotations($limit: Int = 10, $offset: Int = 0) {
            quotations(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {},
      });
      expect(quotations.length).toEqual(2);
    });
  });

  describe("Query.quotations for anonymous user should", () => {
    it("return error", async () => {
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
  describe("Query.quotation for loged user should", () => {
    it("return single quotation when existing id passed", async () => {
      const {
        data: { quotation },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Quotation($quotationId: ID!) {
            quotation(quotationId: $quotationId) {
              _id
            }
          }
        `,
        variables: {
          quotationId: ProposedQuotation._id,
        },
      });
      expect(quotation._id).toEqual(ProposedQuotation._id);
    });

    it("return null when non-existing id passed", async () => {
      const {
        data: { quotation },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Quotation($quotationId: ID!) {
            quotation(quotationId: $quotationId) {
              _id
            }
          }
        `,
        variables: {
          quotationId: "non-existing-id",
        },
      });
      expect(quotation).toBe(null);
    });
  });
});
