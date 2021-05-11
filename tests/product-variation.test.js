import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import {
  SimpleProduct,
  ProductVariations,
  ConfigurableProduct,
  PlanProduct,
} from './seeds/products';

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

  describe('query.translatedProductVariationTexts for admin user should', () => {
    it('return list of product variation texts when provided valid ID', async () => {
      const { data: { translatedProductVariationTexts } = {} } =
        await graphqlFetch({
          query: /* GraphQL */ `
            query TranslatedProductVariationTexts(
              $productVariationId: ID!
              $productVariationOptionValue: String
            ) {
              translatedProductVariationTexts(
                productVariationId: $productVariationId
                productVariationOptionValue: $productVariationOptionValue
              ) {
                _id
                locale
                title
                subtitle
              }
            }
          `,
          variables: {
            productVariationId: ProductVariations[0]._id,
          },
        });

      expect(translatedProductVariationTexts.length).toEqual(2);
    });

    it('return empty array when no match is found', async () => {
      const { data: { translatedProductVariationTexts } = {} } =
        await graphqlFetch({
          query: /* GraphQL */ `
            query TranslatedProductVariationTexts(
              $productVariationId: ID!
              $productVariationOptionValue: String
            ) {
              translatedProductVariationTexts(
                productVariationId: $productVariationId
                productVariationOptionValue: $productVariationOptionValue
              ) {
                _id
              }
            }
          `,
          variables: {
            productVariationId: 'invalid-product-id',
          },
        });
      expect(translatedProductVariationTexts.length).toEqual(0);
    });
  });

  describe('query.translatedProductVariationTexts for anonymous user should', () => {
    it('return valid result', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { data: { translatedProductVariationTexts } = {} } =
        await graphqlAnonymousFetch({
          query: /* GraphQL */ `
            query TranslatedProductVariationTexts(
              $productVariationId: ID!
              $productVariationOptionValue: String
            ) {
              translatedProductVariationTexts(
                productVariationId: $productVariationId
                productVariationOptionValue: $productVariationOptionValue
              ) {
                _id
              }
            }
          `,
          variables: {
            productVariationId: ProductVariations[1]._id,
          },
        });
      expect(translatedProductVariationTexts.length).toEqual(1);
    });
  });

  describe('mutation.createProductVariation for admin user should', () => {
    it('create product variation successfuly when passed CONFIGURABLE_PRODUCT product type', async () => {
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
                }
                value
              }
            }
          }
        `,
        variables: {
          productId: ConfigurableProduct._id,
          variation: {
            key: 'key-1',
            type: 'COLOR',
            title: 'product variation title',
          },
        },
      });

      expect(createProductVariation).toMatchObject({
        texts: {
          title: 'product variation title',
        },
        key: 'key-1',
        type: 'COLOR',
      });
    });

    it('return error when passed non CONFIGURABLE_PRODUCT product type', async () => {
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
          productId: PlanProduct._id,
          variation: {
            key: 'key-1',
            type: 'COLOR',
            title: 'product variation title',
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductWrongTypeError',
        received: PlanProduct.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    });

    it('return error when passed non existing product ID', async () => {
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
      expect(errors[0]?.extensions.code).toEqual('ProductNotFoundError');
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
          productId: '',
          variation: {
            key: 'key-1',
            type: 'COLOR',
            title: 'product variation title',
          },
        },
      });
      expect(errors[0]?.extensions.code).toEqual('InvalidIdError');
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
      const { data: { createProductVariationOption } = {} } =
        await graphqlFetch({
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
      expect(errors[0]?.extensions?.code).toEqual(
        'ProductVariationNotFoundError',
      );
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

  describe('mutation.updateProductVariationTexts for admin user should', () => {
    it('update product variation option texts successfuly', async () => {
      const { data: { updateProductVariationTexts } = {} } = await graphqlFetch(
        {
          query: /* GraphQL */ `
            mutation UpdateProductVariationTexts(
              $productVariationId: ID!
              $productVariationOptionValue: String
              $texts: [UpdateProductVariationTextInput!]!
            ) {
              updateProductVariationTexts(
                productVariationId: $productVariationId
                productVariationOptionValue: $productVariationOptionValue
                texts: $texts
              ) {
                _id
                locale
                title
                subtitle
              }
            }
          `,
          variables: {
            productVariationId: ProductVariations[1]._id,
            productVariationOptionValue: 'variation-option-1-value',
            texts: [
              {
                locale: 'en',
                title: 'variation option 2 title',
              },
            ],
          },
        },
      );

      expect(updateProductVariationTexts[0]._id).not.toBe(null);
      expect(updateProductVariationTexts[0]).toMatchObject({
        locale: 'en',
        title: 'variation option 2 title',
      });
    });

    it('return not found error when passed non existing product variationId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductVariationTexts(
            $productVariationId: ID!
            $productVariationOptionValue: String
            $texts: [UpdateProductVariationTextInput!]!
          ) {
            updateProductVariationTexts(
              productVariationId: $productVariationId
              productVariationOptionValue: $productVariationOptionValue
              texts: $texts
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: 'invalid-product-variation',
          productVariationOptionValue: 'variation-option-2-value',
          texts: [
            {
              locale: 'en',
              title: 'variation option 2 title',
            },
          ],
        },
      });
      expect(errors[0]?.extensions?.code).toEqual(
        'ProductVariationNotFoundError',
      );
    });

    it('return error when passed invalid productvariationId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductVariationTexts(
            $productVariationId: ID!
            $productVariationOptionValue: String
            $texts: [UpdateProductVariationTextInput!]!
          ) {
            updateProductVariationTexts(
              productVariationId: $productVariationId
              productVariationOptionValue: $productVariationOptionValue
              texts: $texts
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: '',
          productVariationOptionValue: 'variation-option-2-value',
          texts: [
            {
              locale: 'en',
              title: 'variation option 2 title',
            },
          ],
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateProductVariationTexts for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductVariationTexts(
            $productVariationId: ID!
            $productVariationOptionValue: String
            $texts: [UpdateProductVariationTextInput!]!
          ) {
            updateProductVariationTexts(
              productVariationId: $productVariationId
              productVariationOptionValue: $productVariationOptionValue
              texts: $texts
            ) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[1]._id,
          productVariationOptionValue: 'variation-option-2-value',
          texts: [
            {
              locale: 'en',
              title: 'variation option 2 title',
            },
          ],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeProductVariationOption for admin user should', () => {
    it('remove product variation option successfuly', async () => {
      const { data: { removeProductVariationOption } = {} } =
        await graphqlFetch({
          query: /* GraphQL */ `
            mutation RemoveProductVariationOption(
              $productVariationId: ID!
              $productVariationOptionValue: String!
            ) {
              removeProductVariationOption(
                productVariationId: $productVariationId
                productVariationOptionValue: $productVariationOptionValue
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
                    title
                    _id
                    subtitle
                    locale
                  }
                  value
                }
              }
            }
          `,
          variables: {
            productVariationId: ProductVariations[1]._id,
            productVariationOptionValue: 'variation-option-1-value',
          },
        });
      expect(removeProductVariationOption.options.length).toEqual(1);
    });

    it('return error when passed invalid product variation ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductVariationOption(
            $productVariationId: ID!
            $productVariationOptionValue: String!
          ) {
            removeProductVariationOption(
              productVariationId: $productVariationId
              productVariationOptionValue: $productVariationOptionValue
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: '',
          productVariationOptionValue: 'variation-option-2-value',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return not found error when passed non existing product variation ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductVariationOption(
            $productVariationId: ID!
            $productVariationOptionValue: String!
          ) {
            removeProductVariationOption(
              productVariationId: $productVariationId
              productVariationOptionValue: $productVariationOptionValue
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: 'non-existing-id',
          productVariationOptionValue: 'variation-option-2-value',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual(
        'ProductVariationNotFoundError',
      );
    });
  });

  describe('mutation.removeProductVariationOption for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveProductVariationOption(
            $productVariationId: ID!
            $productVariationOptionValue: String!
          ) {
            removeProductVariationOption(
              productVariationId: $productVariationId
              productVariationOptionValue: $productVariationOptionValue
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[1]._id,
          productVariationOptionValue: 'variation-option-2-value',
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeProductVariation for admin user should', () => {
    it('remove product variation successfuly', async () => {
      // eslint-disable-next-line no-unused-vars
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

    it('return not found error when passed non existing productVariationId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductVariation($productVariationId: ID!) {
            removeProductVariation(productVariationId: $productVariationId) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual(
        'ProductVariationNotFoundError',
      );
    });

    it('return error when passed invalid productVariationId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductVariation($productVariationId: ID!) {
            removeProductVariation(productVariationId: $productVariationId) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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
