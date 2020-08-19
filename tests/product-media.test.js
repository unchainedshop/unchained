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
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

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
    it('return error', async () => {
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
      // eslint-disable-next-line no-unused-vars
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
