import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleProduct, ProductVariations } from './seeds/products';

let connection;
let graphqlFetch;

describe('ProductsVariation', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('mutation.createProductVariation for admin user should', () => {
    it('create product variation successfuly', async () => {
      const { data: { createProductVariation } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariation(
            $productId: ID!
            $variation: CreateProductVariationInput!
          ) {
            createProductVariation(
              productId: $productId
              variation: $variation
            ) {
              _id
              texts {
                _id
                locale
                title
                subtitle
              }
              type
              key
              options {
                _id
                texts {
                  _id
                  locale
                  title
                  subtitle
                }
                value
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          variation: {
            key: 'key-1',
            type: 'COLOR',
            title: 'product variation title',
          },
        },
      });
      expect(createProductVariation._id).not.toBe(null);
    });

    it('return error when passed invalid product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariation(
            $productId: ID!
            $variation: CreateProductVariationInput!
          ) {
            createProductVariation(
              productId: $productId
              variation: $variation
            ) {
              _id
            }
          }
        `,
        variables: {
          productId: 'invalid-product-id',
          variation: {
            key: 'key-1',
            type: 'COLOR',
            title: 'product variation title',
          },
        },
      });
      expect(errors.length).toEqual(1);
    });
  });
  describe('mutation.createProductVariation for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariation(
            $productId: ID!
            $variation: CreateProductVariationInput!
          ) {
            createProductVariation(
              productId: $productId
              variation: $variation
            ) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          variation: {
            key: 'key-1',
            type: 'COLOR',
            title: 'product variation title',
          },
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.createProductVariationOption for admin user should', () => {
    it('create product variation option successfuly', async () => {
      const {
        data: { createProductVariationOption } = {},
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariationOption(
            $productVariationId: ID!
            $option: CreateProductVariationOptionInput!
          ) {
            createProductVariationOption(
              productVariationId: $productVariationId
              option: $option
            ) {
              _id
              texts {
                _id
              }
              type
              key
              options {
                _id
              }
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[0]._id,
          option: {
            value: 'key-1',
            title: 'product variation option title',
          },
        },
      });
      expect(createProductVariationOption._id).not.toBe(null);
    });

    it('return error when passed invalid product variation ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariationOption(
            $productVariationId: ID!
            $option: CreateProductVariationOptionInput!
          ) {
            createProductVariationOption(
              productVariationId: $productVariationId
              option: $option
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: 'invalid-product-variation',
          option: {
            value: 'key-1',
            title: 'product variation option title',
          },
        },
      });
      expect(errors.length).toEqual(1);
    });
  });
  describe('mutation.createProductVariationOption for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariationOption(
            $productVariationId: ID!
            $option: CreateProductVariationOptionInput!
          ) {
            createProductVariationOption(
              productVariationId: $productVariationId
              option: $option
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[0]._id,
          option: {
            value: 'key-1',
            title: 'product variation option title',
          },
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeProductVariation for admin user should', () => {
    it('remove product variation successfuly', async () => {
      const { data: { removeProductVariation } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductVariation($productVariationId: ID!) {
            removeProductVariation(productVariationId: $productVariationId) {
              _id
              texts {
                _id
                locale
                title
                subtitle
              }
              type
              key
              options {
                _id
              }
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[0]._id,
        },
      });

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductVariation($productVariationId: ID!) {
            removeProductVariation(productVariationId: $productVariationId) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[0]._id,
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeProductVariation for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveProductVariation($productVariationId: ID!) {
            removeProductVariation(productVariationId: $productVariationId) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[0]._id,
        },
      });
      expect(errors.length).toEqual(1);
    });
  });
});
