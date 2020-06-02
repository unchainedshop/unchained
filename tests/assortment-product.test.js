import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { SimpleAssortment } from "./seeds/assortments";
import { SimpleProduct } from "./seeds/products";

let connection;
let graphqlFetch;

describe("AssortmentTexts", () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe("mutation.addAssortmentProduct for admin user should", () => {
    it("add assortmentsuccessfuly when passed valid assortment & product id", async () => {
      const {
        data: { addAssortmentProduct },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct(
            $assortmentId: ID!
            $productId: ID!
            $tags: [String!]
          ) {
            addAssortmentProduct(
              assortmentId: $assortmentId
              productId: $productId
              tags: $tags
            ) {
              _id
              sortKey
              tags
              meta
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[1]._id,
          productId: SimpleProduct._id,
          tags: ["assortment-product-et"],
        },
      });

      expect(addAssortmentProduct._id).not.toBe(null);
    });

    it("return error when passed in-valid product id", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct(
            $assortmentId: ID!
            $productId: ID!
            $tags: [String!]
          ) {
            addAssortmentProduct(
              assortmentId: $assortmentId
              productId: $productId
              tags: $tags
            ) {
              _id
              sortKey
              tags
              meta
              assortment {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          productId: "non-existing-product-id",
          tags: ["assortment-product-et"],
        },
      });

      expect(errors.length).toEqual(1);
    });

    it("return error when passed in-valid assortment id", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct(
            $assortmentId: ID!
            $productId: ID!
            $tags: [String!]
          ) {
            addAssortmentProduct(
              assortmentId: $assortmentId
              productId: $productId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: "non-existing-assortment-id",
          productId: SimpleProduct._id,
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.addAssortmentProduct anonymous user should", () => {
    it("return error", async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentProduct(
            $assortmentId: ID!
            $productId: ID!
            $tags: [String!]
          ) {
            addAssortmentProduct(
              assortmentId: $assortmentId
              productId: $productId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          productId: SimpleProduct._id,
          tags: ["assortment-product-et"],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });
});
