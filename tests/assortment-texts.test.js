import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleAssortment } from './seeds/assortments.js';

let graphqlFetch;

describe('AssortmentTexts', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('mutation.updateAssortmentTexts for admin users should', () => {
    const textRecord = {
      locale: 'et',
      slug: 'slug-et',
      title: 'simple assortment et',
      description: 'text-et',
      subtitle: 'subsimple assortment et',
    };
    it('Update assortment texts successfuly when passed a valid assortment ID', async () => {
      const {
        data: { updateAssortmentTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortmentTexts(
            $assortmentId: ID!
            $texts: [UpdateAssortmentTextInput!]!
          ) {
            updateAssortmentTexts(assortmentId: $assortmentId, texts: $texts) {
              _id
              locale
              slug
              title
              subtitle
              description
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          texts: [textRecord],
        },
      });

      expect(updateAssortmentTexts.length).toEqual(1);
      expect(updateAssortmentTexts[0]).toMatchObject(textRecord);
    });

    it('return not found error when passed a non-existing ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortmentTexts(
            $assortmentId: ID!
            $texts: [UpdateAssortmentTextInput!]!
          ) {
            updateAssortmentTexts(assortmentId: $assortmentId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'none-existing-id',
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple assortment et',
              description: 'text-et',
              subtitle: 'subsimple assortment et',
            },
          ],
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('AssortmentNotFoundError');
    });

    it('return error when passed invalid ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortmentTexts(
            $assortmentId: ID!
            $texts: [UpdateAssortmentTextInput!]!
          ) {
            updateAssortmentTexts(assortmentId: $assortmentId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: '',
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple assortment et',
              description: 'text-et',
              subtitle: 'subsimple assortment et',
            },
          ],
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateAssortmentTexts for anonymous users should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortmentTexts(
            $assortmentId: ID!
            $texts: [UpdateAssortmentTextInput!]!
          ) {
            updateAssortmentTexts(assortmentId: $assortmentId, texts: $texts) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
          texts: [
            {
              locale: 'et',
              slug: 'slug-et',
              title: 'simple assortment et',
              description: 'text-et',
              subtitle: 'subsimple assortment et',
            },
          ],
        },
      });

      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
