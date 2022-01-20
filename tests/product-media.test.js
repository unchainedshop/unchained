import FormData from 'form-data';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  uploadFormData,
  uploadToMinio,
} from './helpers';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users';
import { JpegProductMedia, SimpleProduct } from './seeds/products';

let graphqlFetch;
const fs = require('fs');
const path = require('path');

const productMediaFile = fs.createReadStream(
  path.resolve(__dirname, `./assets/image.jpg`),
);

describe('ProductsVariation', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('Mutation.addProductMedia for admin user should', () => {
    it('upload product media correctly', async () => {
      const body = new FormData();
      body.append(
        'operations',
        JSON.stringify({
          query: `
          mutation addProductMedia($productId: ID!, $media: Upload!){
            addProductMedia(productId: $productId, media: $media){
              _id
              tags
              sortKey
              file {
                _id
                name
                type
                url
              }
            }
          }
        `,
          variables: {
            productId: SimpleProduct._id,
            media: null,
          },
        }),
      );

      body.append('map', JSON.stringify({ 1: ['variables.media'] }));
      body.append('1', productMediaFile);
      const {
        data: { addProductMedia },
      } = await uploadFormData({ token: ADMIN_TOKEN, body });

      expect(addProductMedia?.file.name).toEqual('image.jpg');
    }, 99999);

    it('return ProductNotFoundError when passed non existing product ID', async () => {
      const body = new FormData();
      body.append(
        'operations',
        JSON.stringify({
          query: `
          mutation addProductMedia($productId: ID!, $media: Upload!){
            addProductMedia(productId: $productId, media: $media){
              _id
            }
          }
        `,
          variables: {
            productId: 'non-existing-id',
            media: null,
          },
        }),
      );

      body.append('map', JSON.stringify({ 1: ['variables.media'] }));
      body.append('1', productMediaFile);
      const { errors } = await uploadFormData({ token: ADMIN_TOKEN, body });

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return InvalidIdError when passed Invalid product ID', async () => {
      const body = new FormData();
      body.append(
        'operations',
        JSON.stringify({
          query: `
          mutation addProductMedia($productId: ID!, $media: Upload!){
            addProductMedia(productId: $productId, media: $media){
              _id
            }
          }
        `,
          variables: {
            productId: '',
            media: null,
          },
        }),
      );

      body.append('map', JSON.stringify({ 1: ['variables.media'] }));
      body.append('1', productMediaFile);
      const { errors } = await uploadFormData({ token: ADMIN_TOKEN, body });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.prepareProductMediaUpload for admin user should', () => {
    it('return a sign PUT url for media upload', async () => {
      const {
        data: { prepareProductMediaUpload },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation prepareProductMediaUpload(
            $mediaName: String!
            $productId: ID!
          ) {
            prepareProductMediaUpload(
              mediaName: $mediaName
              productId: $productId
            ) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media',
          productId: SimpleProduct._id,
        },
      });
      expect(prepareProductMediaUpload.putURL).not.toBe(null);
    }, 99999);

    it('upload to minio successfully', async () => {
      const {
        data: { prepareProductMediaUpload },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation prepareProductMediaUpload(
            $mediaName: String!
            $productId: ID!
          ) {
            prepareProductMediaUpload(
              mediaName: $mediaName
              productId: $productId
            ) {
              _id
              putURL
              expires
            }
          }
        `,
        variables: {
          mediaName: 'test-media',
          productId: SimpleProduct._id,
        },
      });

      await uploadToMinio(productMediaFile, prepareProductMediaUpload.putURL);

      expect(prepareProductMediaUpload.putURL).not.toBe(null);
    }, 99999);

    it('link uploaded media file with product media successfully', async () => {
      const {
        data: { prepareProductMediaUpload },
      } = await graphqlFetch(
        {
          query: /* GraphQL */ `
            mutation prepareProductMediaUpload(
              $mediaName: String!
              $productId: ID!
            ) {
              prepareProductMediaUpload(
                mediaName: $mediaName
                productId: $productId
              ) {
                _id
                putURL
                expires
              }
            }
          `,
          variables: {
            mediaName: 'test-media',
            productId: SimpleProduct._id,
          },
        },
        99999,
      );

      await uploadToMinio(productMediaFile, prepareProductMediaUpload.putURL);

      const {
        data: { confirmMediaUpload },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation confirmMediaUpload(
            $mediaUploadTicketId: ID!
            $size: Int!
            $type: String!
          ) {
            confirmMediaUpload(
              mediaUploadTicketId: $mediaUploadTicketId
              size: $size
              type: $type
            ) {
              _id
              name
              type
              size
            }
          }
        `,
        variables: {
          mediaUploadTicketId: prepareProductMediaUpload._id,
          size: 8000,
          type: 'image/jpg',
        },
      });
      expect(confirmMediaUpload).toMatchObject({
        _id: prepareProductMediaUpload._id,
        name: 'test-media',
        type: 'image/jpg',
        size: 8000,
      });
    });
  });

  describe('Mutation.addProductMedia for normal user should', () => {
    it('return NoPermissionError', async () => {
      const body = new FormData();
      body.append(
        'operations',
        JSON.stringify({
          query: `
          mutation addProductMedia($productId: ID!, $media: Upload!){
            addProductMedia(productId: $productId, media: $media){
              _id
            }
          }
        `,
          variables: {
            productId: SimpleProduct._id,
            media: null,
          },
        }),
      );

      body.append('map', JSON.stringify({ 1: ['variables.media'] }));
      body.append('1', productMediaFile);
      const { errors } = await uploadFormData({ token: USER_TOKEN, body });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.addProductMedia for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const body = new FormData();
      body.append(
        'operations',
        JSON.stringify({
          query: `
          mutation addProductMedia($productId: ID!, $media: Upload!){
            addProductMedia(productId: $productId, media: $media){
              _id
            }
          }
        `,
          variables: {
            productId: SimpleProduct._id,
            media: null,
          },
        }),
      );

      body.append('map', JSON.stringify({ 1: ['variables.media'] }));
      body.append('1', productMediaFile);
      const { errors } = await uploadFormData({
        body,
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('mutation.reorderProductMedia for admin user should', () => {
    it('update product media sortkey successfuly when provided valid media ID', async () => {
      const { data: { reorderProductMedia } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderProductmedia(
            $sortKeys: [ReorderProductMediaInput!]!
          ) {
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

      expect(reorderProductMedia[0].sortKey).toEqual(11);
    });

    it('skiped any passed sort key passed with in-valid media ID', async () => {
      const {
        data: { reorderProductMedia },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation ReorderProductmedia(
            $sortKeys: [ReorderProductMediaInput!]!
          ) {
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
      expect(reorderProductMedia.length).toEqual(0);
    });
  });

  describe('mutation.reorderProductMedia for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation ReorderProductmedia(
            $sortKeys: [ReorderProductMediaInput!]!
          ) {
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

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.updateProductMediaTexts for admin user should', () => {
    it('update product media text successfuly when provided valid media ID', async () => {
      const { data: { updateProductMediaTexts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateproductMediaTexts(
            $productMediaId: ID!
            $texts: [UpdateProductMediaTextInput!]!
          ) {
            updateProductMediaTexts(
              productMediaId: $productMediaId
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
          productMediaId: JpegProductMedia._id,
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });

      expect(updateProductMediaTexts[0]._id).not.toBe(null);
      expect(updateProductMediaTexts[0]).toMatchObject({
        locale: 'en',
        title: 'english title',
        subtitle: 'english title subtitle',
      });
    });

    it('return not found error when passed non existing media ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateproductMediaTexts(
            $productMediaId: ID!
            $texts: [UpdateProductMediaTextInput!]!
          ) {
            updateProductMediaTexts(
              productMediaId: $productMediaId
              texts: $texts
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductMediaNotFoundError');
    });

    it('return error when passed invalid media ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateproductMediaTexts(
            $productMediaId: ID!
            $texts: [UpdateProductMediaTextInput!]!
          ) {
            updateProductMediaTexts(
              productMediaId: $productMediaId
              texts: $texts
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateProductMediaTexts for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateproductMediaTexts(
            $productMediaId: ID!
            $texts: [UpdateProductMediaTextInput!]!
          ) {
            updateProductMediaTexts(
              productMediaId: $productMediaId
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
          productMediaId: JpegProductMedia._id,
          texts: {
            locale: 'en',
            title: 'english title',
            subtitle: 'english title subtitle',
          },
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.removeProductMedia for admin user should', () => {
    it('remove product media successfuly when provided valid media ID', async () => {
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

      expect(errors.length).toEqual(1);
    }, 99999);

    it('return not found error when passed non existing productMediaId', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('ProductMediaNotFoundError');
    });

    it('return error when passed invalid productMediaId', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.removeProductMedia for anonymous user should', () => {
    it('return error', async () => {
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

      expect(errors.length).toEqual(1);
    });
  });
});
