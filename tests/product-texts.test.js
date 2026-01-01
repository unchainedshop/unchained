import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleProduct } from './seeds/products.js';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

let graphqlFetch;

test.describe('Product: Texts', async () => {
  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.updateProductTexts should for admin user', async () => {
    test('Update product texts successfuly', async () => {
      const textRecord = {
        locale: 'et',
        slug: 'slug-et',
        title: 'simple product title et',
        brand: 'brand-et',
        description: 'text-et',
        labels: ['label-et-1', 'label-et-2'],
        subtitle: 'subtitle-et',
        vendor: 'vendor-et',
      };
      const { data: { updateProductTexts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts($productId: ID!, $texts: [ProductTextInput!]!) {
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
      assert.equal(updateProductTexts.length, 1);
      assert.partialDeepStrictEqual(updateProductTexts[0], textRecord);
    });

    test('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts($productId: ID!, $texts: [ProductTextInput!]!) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple product title et',
              brand: 'brand-et',
              description: 'text-et',
              labels: ['label-et-1', 'label-et-2'],
              subtitle: 'subtitle-et',
              vendor: 'vendor-et',
            },
          ],
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts($productId: ID!, $texts: [ProductTextInput!]!) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple product title et',
              brand: 'brand-et',
              description: 'text-et',
              labels: ['label-et-1', 'label-et-2'],
              subtitle: 'subtitle-et',
              vendor: 'vendor-et',
            },
          ],
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateProductTexts for anonymous user', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductTexts($productId: ID!, $texts: [ProductTextInput!]!) {
            updateProductTexts(productId: $productId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple product title et',
              brand: 'brand-et',
              description: 'text-et',
              labels: ['label-et-1', 'label-et-2'],
              subtitle: 'subtitle-et',
              vendor: 'vendor-et',
            },
          ],
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
