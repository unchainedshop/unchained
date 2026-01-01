import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleProduct, ProductVariations, ConfigurableProduct, PlanProduct } from './seeds/products.js';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

let graphqlFetch;

test.describe('Product: Variations', async () => {
  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.createProductVariation for admin user should', async () => {
    test('create product variation successfully when passed CONFIGURABLE_PRODUCT product type', async () => {
      const { data: { createProductVariation } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariation(
            $productId: ID!
            $variation: CreateProductVariationInput!
            $texts: [ProductVariationTextInput!]
          ) {
            createProductVariation(productId: $productId, variation: $variation, texts: $texts) {
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
          },
          texts: [{ title: 'product variation title', locale: 'de' }],
        },
      });

      assert.partialDeepStrictEqual(createProductVariation, {
        texts: {
          title: 'product variation title',
        },
        key: 'key-1',
        type: 'COLOR',
      });
    });

    test('return error when passed non CONFIGURABLE_PRODUCT product type', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariation(
            $productId: ID!
            $variation: CreateProductVariationInput!
            $texts: [ProductVariationTextInput!]
          ) {
            createProductVariation(productId: $productId, variation: $variation, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          variation: {
            key: 'key-1',
            type: 'COLOR',
          },
          texts: [{ title: 'product variation title', locale: 'de' }],
        },
      });

      assert.partialDeepStrictEqual(errors?.[0]?.extensions, {
        code: 'ProductWrongTypeError',
        received: PlanProduct.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    });

    test('return error when passed non existing product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariation(
            $productId: ID!
            $variation: CreateProductVariationInput!
            $texts: [ProductVariationTextInput!]
          ) {
            createProductVariation(productId: $productId, variation: $variation, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: 'invalid-product-id',
          variation: {
            key: 'key-1',
            type: 'COLOR',
          },
          texts: [{ title: 'product variation title', locale: 'de' }],
        },
      });
      assert.equal(errors[0]?.extensions.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid product ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariation(
            $productId: ID!
            $variation: CreateProductVariationInput!
            $texts: [ProductVariationTextInput!]
          ) {
            createProductVariation(productId: $productId, variation: $variation, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          variation: {
            key: 'key-1',
            type: 'COLOR',
          },
          texts: [{ title: 'product variation title', locale: 'de' }],
        },
      });
      assert.equal(errors[0]?.extensions.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.createProductVariation for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariation(
            $productId: ID!
            $variation: CreateProductVariationInput!
            $texts: [ProductVariationTextInput!]
          ) {
            createProductVariation(productId: $productId, variation: $variation, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          variation: {
            key: 'key-1',
            type: 'COLOR',
          },
          texts: [{ title: 'product variation title', locale: 'de' }],
        },
      });
      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.createProductVariationOption for admin user should', async () => {
    test('create product variation option successfully', async () => {
      const { data: { createProductVariationOption } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariationOption(
            $productVariationId: ID!
            $option: String!
            $texts: [ProductVariationTextInput!]
          ) {
            createProductVariationOption(
              productVariationId: $productVariationId
              option: $option
              texts: $texts
            ) {
              _id
              texts {
                _id
              }
              type
              key
              options {
                _id
                value
                texts {
                  title
                }
              }
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[0]._id,
          option: 'key-1',
          texts: [{ title: 'product variation option title', locale: 'de' }],
        },
      });
      assert.equal(createProductVariationOption._id, ProductVariations[0]._id);
      assert.deepStrictEqual(
        createProductVariationOption.options[createProductVariationOption.options.length - 1],
        {
          _id: 'product-color-variation-1:key-1',
          value: 'key-1',
          texts: {
            title: 'product variation option title',
          },
        },
      );
    });

    test('return error when passed invalid product variation ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariationOption(
            $productVariationId: ID!
            $option: String!
            $texts: [ProductVariationTextInput!]
          ) {
            createProductVariationOption(
              productVariationId: $productVariationId
              option: $option
              texts: $texts
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: 'invalid-product-variation',
          option: 'key-1',
          texts: [{ title: 'product variation option title', locale: 'de' }],
        },
      });
      assert.equal(errors[0]?.extensions?.code, 'ProductVariationNotFoundError');
    });
  });

  test.describe('mutation.createProductVariationOption for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation CreateProductVariationOption(
            $productVariationId: ID!
            $option: String!
            $texts: [ProductVariationTextInput!]
          ) {
            createProductVariationOption(
              productVariationId: $productVariationId
              option: $option
              texts: $texts
            ) {
              _id
            }
          }
        `,
        variables: {
          productVariationId: ProductVariations[0]._id,
          option: 'key-1',
          texts: [{ title: 'product variation option title', locale: 'de' }],
        },
      });

      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.updateProductVariationTexts for admin user should', async () => {
    test('update product variation option texts successfuly', async () => {
      const { data: { updateProductVariationTexts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductVariationTexts(
            $productVariationId: ID!
            $productVariationOptionValue: String
            $texts: [ProductVariationTextInput!]!
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
      });

      assert.notEqual(updateProductVariationTexts[0]._id, null);
      assert.partialDeepStrictEqual(updateProductVariationTexts[0], {
        locale: 'en',
        title: 'variation option 2 title',
      });
    });

    test('return not found error when passed non existing product variationId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductVariationTexts(
            $productVariationId: ID!
            $productVariationOptionValue: String
            $texts: [ProductVariationTextInput!]!
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
      assert.equal(errors[0]?.extensions?.code, 'ProductVariationNotFoundError');
    });

    test('return error when passed invalid productvariationId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductVariationTexts(
            $productVariationId: ID!
            $productVariationOptionValue: String
            $texts: [ProductVariationTextInput!]!
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
      assert.equal(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateProductVariationTexts for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductVariationTexts(
            $productVariationId: ID!
            $productVariationOptionValue: String
            $texts: [ProductVariationTextInput!]!
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

      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeProductVariationOption for admin user should', async () => {
    test('remove product variation option successfuly', async () => {
      const { data: { removeProductVariationOption } = {} } = await graphqlFetch({
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
      assert.equal(removeProductVariationOption.options.length, 2);
      assert.equal(
        removeProductVariationOption.options.filter((o) => o.value === 'variation-option-1-value')
          .length,
        0,
      );
    });

    test('return error when passed invalid product variation ID', async () => {
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
      assert.equal(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('return not found error when passed non existing product variation ID', async () => {
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
      assert.equal(errors[0]?.extensions?.code, 'ProductVariationNotFoundError');
    });
  });

  test.describe('mutation.removeProductVariationOption for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
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

      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeProductVariation for admin user should', async () => {
    test('remove product variation successfuly', async () => {
      await graphqlFetch({
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
      assert.equal(errors[0].extensions?.code, 'ProductVariationNotFoundError');
    });

    test('return not found error when passed non existing productVariationId', async () => {
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
      assert.equal(errors[0]?.extensions?.code, 'ProductVariationNotFoundError');
    });

    test('return error when passed invalid productVariationId', async () => {
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
      assert.equal(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.removeProductVariation for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
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
      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
