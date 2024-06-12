import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers.js";
import { ADMIN_TOKEN } from "./seeds/users.js";
import { SimpleProduct } from "./seeds/products.js";

let graphqlFetch;

describe("ProductText", () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe("mutation.updateProductTexts should for admin user", () => {
    it("Update product texts successfuly", async () => {
      const textRecord = {
        locale: "et",
        slug: "slug-et",
        title: "simple product title et",
        brand: "brand-et",
        description: "text-et",
        labels: ["label-et-1", "label-et-2"],
        subtitle: "subtitle-et",
        vendor: "vendor-et",
      };
      const { data: { updateProductTexts } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [ProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
              locale
              slug
              title
              subtitle
              description
              brand
              vendor
              labels
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          texts: [textRecord],
        },
      });
console.log(errors)
      expect(updateProductTexts.length).toEqual(1);
      expect(updateProductTexts[0]).toMatchObject(textRecord);
    });

    it("return not found error when passed non existing productId", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [ProductTextInput!]!
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

      expect(errors[0]?.extensions?.code).toEqual("ProductNotFoundError");
    });

    it("return error when passed invalid productId", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [ProductTextInput!]!
          ) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: "",
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

      expect(errors[0]?.extensions?.code).toEqual("InvalidIdError");
    });
  });

  describe("mutation.updateProductTexts for anonymous user", () => {
    it("return error", async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts(
            $productId: ID!
            $texts: [ProductTextInput!]!
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

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
