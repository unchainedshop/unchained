import assert from 'node:assert';
import test from 'node:test';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleAssortment } from './seeds/assortments.js';

test.describe('AssortmentTexts', () => {
  let graphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('mutation.updateAssortmentTexts for admin users should', () => {
    const textRecord = {
      locale: 'et',
      slug: 'slug-et',
      title: 'simple assortment et',
      description: 'text-et',
      subtitle: 'subsimple assortment et',
    };
    test('Update assortment texts successfuly when passed a valid assortment ID', async () => {
      const {
        data: { updateAssortmentTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortmentTexts($assortmentId: ID!, $texts: [AssortmentTextInput!]!) {
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

      assert.strictEqual(updateAssortmentTexts.length, 1);
      assert.partialDeepStrictEqual(updateAssortmentTexts[0], textRecord);
    });

    test('return not found error when passed a non-existing ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortmentTexts($assortmentId: ID!, $texts: [AssortmentTextInput!]!) {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'AssortmentNotFoundError');
    });

    test('return error when passed invalid ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortmentTexts($assortmentId: ID!, $texts: [AssortmentTextInput!]!) {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('mutation.updateAssortmentTexts for anonymous users should', () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateAssortmentTexts($assortmentId: ID!, $texts: [AssortmentTextInput!]!) {
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

      assert.strictEqual(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
