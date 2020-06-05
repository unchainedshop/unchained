import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { JpegProductMedia } from './seeds/products';

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

      expect(updateProductMediaTexts._id).not.toBe(null);
    });

    it('return error when passed in-valid media ID', async () => {
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
              locale
              title
              subtitle
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
      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.updateProductMediaTexts for anonymous user should', () => {
    it('remove product media successfuly when provided valid media ID', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

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
      const { data: { removeProductMedia } = {} } = await graphqlFetch({
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
                meta
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
    });
  });

  describe('mutation.removeProductMedia for anonymous user should', () => {
    it('remove product media successfuly when provided valid media ID', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

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
