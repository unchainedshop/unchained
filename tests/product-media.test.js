import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, putFile, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { JpegProductMedia, SimpleProduct } from './seeds/products.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

const dirname = path.dirname(fileURLToPath(import.meta.url));

let graphqlFetch;

const productMediaFile2 = fs.createReadStream(path.resolve(dirname, `./assets/zurich.jpg`));
const productMediaFile3 = fs.createReadStream(path.resolve(dirname, `./assets/contract.pdf`));

test.describe('Product: Media', async () => {
  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.prepareProductMediaUpload for admin user should', async () => {
    test('return a sign PUT url for media upload', async () => {
      const result = await graphqlFetch({
        query: /* GraphQL */ `
          mutation prepareProductMediaUpload($mediaName: String!, $productId: ID!) {
            prepareProductMediaUpload(mediaName: $mediaName, productId: $productId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          productId: SimpleProduct._id,
        },
      });
      assert.ok(!result.errors, `GraphQL errors: ${JSON.stringify(result.errors)}`);
      assert.notStrictEqual(result.data.prepareProductMediaUpload.putURL, null);
    });

    test('upload file via PUT successfully', async () => {
      const {
        data: { prepareProductMediaUpload },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation prepareProductMediaUpload($mediaName: String!, $productId: ID!) {
            prepareProductMediaUpload(mediaName: $mediaName, productId: $productId) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media.jpg',
          productId: SimpleProduct._id,
        },
      });

      await putFile(productMediaFile2, {
        url: prepareProductMediaUpload.putURL,
      });

      assert.notStrictEqual(prepareProductMediaUpload.putURL, null);
    });

    test('link uploaded media file with product media successfully', async () => {
      const {
        data: { prepareProductMediaUpload },
      } = await graphqlFetch(
        {
          query: /* GraphQL */ `
            mutation prepareProductMediaUpload($mediaName: String!, $productId: ID!) {
              prepareProductMediaUpload(mediaName: $mediaName, productId: $productId) {
                _id
                putURL
                expires
              }
            }
          `,
          variables: {
            mediaName: 'test-media.pdf',
            productId: SimpleProduct._id,
          },
        },
        10000,
      );

      await putFile(productMediaFile3, {
        url: prepareProductMediaUpload.putURL,
        type: 'image/jpeg',
      });

      const {
        data: { confirmMediaUpload },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation confirmMediaUpload($mediaUploadTicketId: ID!, $size: Int!, $type: String!) {
            confirmMediaUpload(mediaUploadTicketId: $mediaUploadTicketId, size: $size, type: $type) {
              _id
              name
              type
              size
            }
          }
        `,
        variables: {
          mediaUploadTicketId: prepareProductMediaUpload._id,
          size: 8615,
          type: 'image/jpeg',
        },
      });
      assert.deepStrictEqual(confirmMediaUpload, {
        _id: prepareProductMediaUpload._id,
        name: 'test-media.pdf',
        type: 'image/jpeg',
        size: 8615,
      });
    });
  });

  test.describe('mutation.reorderProductMedia for admin user should', async () => {
    test('update product media sortkey successfuly when provided valid media ID', async () => {
      const { data: { reorderProductMedia } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderProductmedia($sortKeys: [ReorderProductMediaInput!]!) {
            reorderProductMedia(sortKeys: $sortKeys) {
              _id
              tags
              file {
                _id
              }
              sortKey
              texts {
                _id
              }
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              productMediaId: JpegProductMedia._id,
              sortKey: 10,
            },
          ],
        },
      });

      assert.strictEqual(reorderProductMedia[0].sortKey, 11);
    });

    test('skiped any passed sort key passed with in-valid media ID', async () => {
      const {
        data: { reorderProductMedia },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderProductmedia($sortKeys: [ReorderProductMediaInput!]!) {
            reorderProductMedia(sortKeys: $sortKeys) {
              _id
              tags
              file {
                _id
              }
              sortKey
              texts {
                _id
              }
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              productMediaId: 'invalid-media-id',
              sortKey: 10,
            },
          ],
        },
      });
      assert.strictEqual(reorderProductMedia.length, 0);
    });
  });

  test.describe('mutation.reorderProductMedia for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation ReorderProductmedia($sortKeys: [ReorderProductMediaInput!]!) {
            reorderProductMedia(sortKeys: $sortKeys) {
              _id
            }
          }
        `,
        variables: {
          sortKeys: [
            {
              productMediaId: JpegProductMedia._id,
              sortKey: 10,
            },
          ],
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.updateProductMediaTexts for admin user should', async () => {
    test('update product media text successfuly when provided valid media ID', async () => {
      const { data: { updateProductMediaTexts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateproductMediaTexts($productMediaId: ID!, $texts: [ProductMediaTextInput!]!) {
            updateProductMediaTexts(productMediaId: $productMediaId, texts: $texts) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          productMediaId: JpegProductMedia._id,
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });

      assert.notStrictEqual(updateProductMediaTexts[0]._id, null);
      assert.partialDeepStrictEqual(updateProductMediaTexts[0], {
        locale: 'en',
        title: 'english title',
        subtitle: 'english title subtitle',
      });
    });

    test('return not found error when passed non existing media ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateproductMediaTexts($productMediaId: ID!, $texts: [ProductMediaTextInput!]!) {
            updateProductMediaTexts(productMediaId: $productMediaId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productMediaId: 'invalid-media-id',
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductMediaNotFoundError');
    });

    test('return error when passed invalid media ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateproductMediaTexts($productMediaId: ID!, $texts: [ProductMediaTextInput!]!) {
            updateProductMediaTexts(productMediaId: $productMediaId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          productMediaId: '',
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateProductMediaTexts for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateproductMediaTexts($productMediaId: ID!, $texts: [ProductMediaTextInput!]!) {
            updateProductMediaTexts(productMediaId: $productMediaId, texts: $texts) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          productMediaId: JpegProductMedia._id,
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('mutation.removeProductMedia for admin user should', async () => {
    test('remove product media successfuly when provided valid media ID', async () => {
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductMedia($productMediaId: ID!) {
            removeProductMedia(productMediaId: $productMediaId) {
              _id
              tags
              file {
                _id
                name
                type
                size
                url
              }
              sortKey
              texts {
                _id
                locale
                title
                subtitle
              }
            }
          }
        `,
        variables: {
          productMediaId: JpegProductMedia._id,
        },
      });

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductMedia($productMediaId: ID!) {
            removeProductMedia(productMediaId: $productMediaId) {
              _id
            }
          }
        `,
        variables: {
          productMediaId: JpegProductMedia._id,
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductMediaNotFoundError');
    });

    test('return not found error when passed non existing productMediaId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductMedia($productMediaId: ID!) {
            removeProductMedia(productMediaId: $productMediaId) {
              _id
            }
          }
        `,
        variables: {
          productMediaId: 'non-existing-id',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'ProductMediaNotFoundError');
    });

    test('return error when passed invalid productMediaId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveProductMedia($productMediaId: ID!) {
            removeProductMedia(productMediaId: $productMediaId) {
              _id
            }
          }
        `,
        variables: {
          productMediaId: '',
        },
      });

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.removeProductMedia for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation RemoveProductMedia($productMediaId: ID!) {
            removeProductMedia(productMediaId: $productMediaId) {
              _id
            }
          }
        `,
        variables: {
          productMediaId: JpegProductMedia._id,
        },
      });

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
