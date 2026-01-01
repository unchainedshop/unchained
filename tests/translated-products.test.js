import { test } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { ProductVariations } from './seeds/products.js';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

let graphqlFetch;
let graphqlAnonymousFetch;

test.describe('Product: Translated Texts', async () => {
  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlAnonymousFetch = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test('translatedProductTexts', async () => {
    const { errors } = await graphqlAnonymousFetch({
      query: /* GraphQL */ `
        {
          translatedProductTexts(productId: "simpleproduct") {
            locale
            slug
          }
        }
      `,
    });

    assert.equal(errors[0].extensions?.code, 'NoPermissionError');
  });

  test('translatedProductMediaTexts', async () => {
    const { errors } = await graphqlAnonymousFetch({
      query: /* GraphQL */ `
        {
          translatedProductMediaTexts(productMediaId: "jpeg-product") {
            title
            locale
          }
        }
      `,
    });

    assert.equal(errors[0].extensions?.code, 'NoPermissionError');
  });

  test.describe('query.translatedProductVariationTexts for admin user should', async () => {
    test('return list of product variation texts when provided valid ID', async () => {
      const { data: { translatedProductVariationTexts } = {} } = await graphqlFetch({
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
      assert.equal(translatedProductVariationTexts.length, 2);
      assert.deepStrictEqual(translatedProductVariationTexts, [
        {
          _id: 'product-color-variation-1-en-text',
          locale: 'en',
          title: 'product color variation title',
          subtitle: null,
        },
        {
          _id: 'product-color-variation-1-de-text',
          locale: 'de',
          title: 'product color variation title de',
          subtitle: null,
        },
      ]);
    });

    test('return empty array when no match is found', async () => {
      const { data: { translatedProductVariationTexts } = {} } = await graphqlFetch({
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
      assert.equal(translatedProductVariationTexts.length, 0);
    });
  });

  test.describe('query.translatedProductVariationTexts for admin user should', async () => {
    test('return valid result', async () => {
      const { data: { translatedProductVariationTexts } = {} } = await graphqlFetch({
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
          productVariationId: ProductVariations[1]._id,
        },
      });
      assert.deepStrictEqual(translatedProductVariationTexts, [
        {
          _id: 'product-text-variation-2-en-text',
          locale: 'en',
          subtitle: null,
          title: 'product text variation title',
        },
        {
          _id: 'product-text-variation-2-de-text',
          locale: 'de',
          subtitle: null,
          title: 'product text variation title de',
        },
      ]);
    });
  });
});
