import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { SimpleProduct } from "./seeds/products";
let connection;
let graphqlFetch;

describe("ProductText", () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

<<<<<<< HEAD
  describe("mutation.updateProductWarehousing should for admin user", () => {
=======
  describe("mutation.updateProductWarehousing should for loged in user", () => {
>>>>>>> Add mutation.updateProductTexts tests
    it("Update product warehousing successfuly", async () => {
      const { data: { updateProductTexts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [UpdateProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
              locale
              slug
              title
              description
              brand
              vendor
              labels
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          texts: [
            {
              locale: "et",
              slug: "slug-et",
              title: "simple product title et",
              brand: "brand-et",
              description: "text-et",
              labels: ["label-et-1", "label-et-2"],
              subtitle: "subtitle-et",
              vendor: "vendor-et",
            },
          ],
        },
      });

      expect(updateProductTexts.length).toEqual(1);
    });

    it("return error when attempting to update non existing product", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [UpdateProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: "none-existing-id",
          texts: [
            {
              locale: "et",
              slug: "slug-et",
              title: "simple product title et",
              brand: "brand-et",
              description: "text-et",
              labels: ["label-et-1", "label-et-2"],
              subtitle: "subtitle-et",
              vendor: "vendor-et",
            },
          ],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.updateProductWarehousing for anonymous user", () => {
    it("return error", async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [UpdateProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          texts: [
            {
              locale: "et",
              slug: "slug-et",
              title: "simple product title et",
              brand: "brand-et",
              description: "text-et",
              labels: ["label-et-1", "label-et-2"],
              subtitle: "subtitle-et",
              vendor: "vendor-et",
            },
          ],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });
});
