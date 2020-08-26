import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleAssortment } from './seeds/assortments';

let connection;
let graphqlFetch;

describe('AssortmentTexts', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('mutation.updateAssortmentTexts for admin users should', () => {
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

      expect(updateAssortmentTexts.length).toEqual(1);
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

      expect(errors.length).toEqual(1);
    });
  });
});
