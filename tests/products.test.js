import { setupDatabase, createLoggedInGraphqlFetch } from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { SimpleProduct, UnpublishedProduct } from "./seeds/products";
let connection;
let graphqlFetch;

describe("Products", () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe("Mutation.createProduct", () => {
    it("create a new product", async () => {
      const { data: { createProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createProduct($product: CreateProductInput!) {
            createProduct(product: $product) {
              status
              tags
              texts {
                title
              }
              ... on SimpleProduct {
                catalogPrice {
                  _id
                  price {
                    amount
                    currency
                  }
                }
                simulatedPrice {
                  _id
                  price {
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          product: {
            title: "Simple Product",
            type: "SimpleProduct",
            tags: ["simple"],
          },
        },
      });
      expect(createProduct).toMatchObject({
        tags: ["simple"],
        status: "DRAFT",
        texts: {
          title: "Simple Product",
        },
        catalogPrice: null,
        simulatedPrice: null,
      });
    });
  });

  describe("Mutation.unpublishProduct", () => {
    it("unpublish product", async () => {
      const { data: { unpublishProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UnPublishProduct($productId: ID!) {
            unpublishProduct(productId: $productId) {
              _id
              sequence
              status
              published
              tags
              created
              updated
              texts {
                _id
              }
              media {
                _id
              }
              reviews {
                _id
              }
              meta
              assortmentPaths {
                assortmentProduct {
                  _id
                }
                links {
                  assortmentId
                  link {
                    _id
                  }
                }
              }
              siblings {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
        },
      });

      expect(unpublishProduct.published).toBe(null);
    });
    it("return error for non-existing product id", async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UnpublishProduct($productId: ID!) {
            unpublishProduct(productId: $productId) {
              _id
            }
          }
        `,
        variables: {
          productId: "non-existing-id",
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.publishProduct", () => {
    xit("publish production", async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation PublishProduct($productId: ID!) {
            publishProduct(productId: $productId) {
              _id
              sequence
              status
              published
              tags
              created
              updated
              texts {
                _id
              }
              media {
                _id
              }
              reviews {
                _id
              }
              meta
              assortmentPaths {
                assortmentProduct {
                  _id
                }
                links {
                  assortmentId
                  link {
                    _id
                  }
                }
              }
              siblings {
                _id
              }
            }
          }
        `,
        variables: {
          productId: UnpublishedProduct._id,
        },
      });
      console.log(errors);
    });

    it("return error for non-existing product id", async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation PublishProduct($productId: ID!) {
            publishProduct(productId: $productId) {
              _id
            }
          }
        `,
        variables: {
          productId: "non-existing-id",
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe("Mutation.updateProduct should", () => {
    it("update successfuly when passed valid product ID ", async () => {
      const { data: { updateProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProduct(
            $productId: ID!
            $product: UpdateProductInput!
          ) {
            updateProduct(productId: $productId, product: $product) {
              _id
              sequence
              tags
              meta
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          product: {
            sequence: 1,
            tags: ["tag-1", "tag-2", "highlight", "update-tag"],
            meta: {
              updated: true,
            },
          },
        },
      });

      expect(updateProduct).toMatchObject({
        _id: "simpleproduct",
        sequence: 1,
        tags: ["tag-1", "tag-2", "highlight", "update-tag"],
        meta: { updated: true },
      });
    });

    it("return error when passed non-existing product id", async () => {
      const { errors = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProduct(
            $productId: ID!
            $product: UpdateProductInput!
          ) {
            updateProduct(productId: $productId, product: $product) {
              _id
            }
          }
        `,
        variables: {
          productId: "none-existing-id",
          product: {
            sequence: 1,
            tags: ["tag-1", "tag-2", "highlight", "update-tag"],
            meta: {
              updated: true,
            },
          },
        },
      });
      expect(errors.length).toEqual(1);
    });
  });
});
