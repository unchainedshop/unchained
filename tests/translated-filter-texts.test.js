import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { MultiChoiceFilter } from "./seeds/filters";

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

  describe("Query.translatedFilterTexts for loged in user", () => {
    it("return array of translatedFilterTexts text when existing id is passed", async () => {
      const {
        data: { translatedFilterTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
          ) {
            translatedFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
            ) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          filterId: MultiChoiceFilter._id,
        },
      });

      expect(translatedFilterTexts.length).toEqual(2);
    });

    it("return empty array for non-existing id is passed", async () => {
      const {
        data: { translatedFilterTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
          ) {
            translatedFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
            ) {
              _id
            }
          }
        `,
        variables: {
          filterId: "non-existing-id",
        },
      });

      expect(translatedFilterTexts.length).toEqual(0);
    });
  });

  describe("Query.TranslatedFilterTexts for anonymous user should", () => {
    it("return error", async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query TranslatedFilterTexts(
            $filterId: ID!
            $filterOptionValue: String
          ) {
            translatedFilterTexts(
              filterId: $filterId
              filterOptionValue: $filterOptionValue
            ) {
              _id
            }
          }
        `,
        variables: {
          filterId: "non-existing-id",
        },
      });
      expect(errors.length).toEqual(1);
    });
  });
});
