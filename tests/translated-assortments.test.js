import { test } from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { SimpleAssortment, PngAssortmentMedia } from './seeds/assortments.js';

let graphqlFetch;

test.describe('Assortment: Translated Texts', async () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.translatedAssortmentsText for admin user should', async () => {
    test('return list of assortment text when existing id is passed', async () => {
      const {
        data: { translatedAssortmentTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentTexts($assortmentId: ID!) {
            translatedAssortmentTexts(assortmentId: $assortmentId) {
              _id
              title
              description
              locale
              subtitle
              slug
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
        },
      });
      assert.equal(translatedAssortmentTexts.length, 2);
      assert.deepStrictEqual(translatedAssortmentTexts, [
        {
          _id: 'german',
          title: 'simple assortment de',
          description: 'text-de',
          locale: 'de',
          subtitle: 'subsimple assortment de',
          slug: 'slug-de',
        },
        {
          _id: 'french',
          title: 'title-fr',
          description: 'text-fr-1',
          locale: 'fr',
          subtitle: 'subtitle-fr',
          slug: 'slug-fr',
        },
      ]);
    });

    test('return empty array when non-existing id is passed', async () => {
      const {
        data: { translatedAssortmentTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentTexts($assortmentId: ID!) {
            translatedAssortmentTexts(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'non-existing-id',
        },
      });

      assert.equal(translatedAssortmentTexts.length, 0);
    });
  });

  test.describe('Query.translatedAssortmentTexts for anonymous user should', async () => {
    test('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentTexts($assortmentId: ID!) {
            translatedAssortmentTexts(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
        },
      });
      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.translatedAssortmentMediaTexts for admin user should', async () => {
    test('return list of assortment media texts when existing id is passed', async () => {
      const {
        data: { translatedAssortmentMediaTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentMediaTexts($assortmentMediaId: ID!) {
            translatedAssortmentMediaTexts(assortmentMediaId: $assortmentMediaId) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          assortmentMediaId: PngAssortmentMedia._id,
        },
      });
      assert.equal(translatedAssortmentMediaTexts.length, 2);
      assert.deepStrictEqual(translatedAssortmentMediaTexts, [
        {
          _id: 'german-png-assortment',
          locale: 'de',
          title: 'assortment-media-title-de',
          subtitle: 'assortment-media-subtitle-de',
        },
        {
          _id: 'french-png-assortment',
          locale: 'fr',
          title: 'assortment-media-title-fr',
          subtitle: 'assortment-media-subtitle-fr',
        },
      ]);
    });

    test('return empty array when non-existing id is passed', async () => {
      const {
        data: { translatedAssortmentMediaTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentMediaTexts($assortmentMediaId: ID!) {
            translatedAssortmentMediaTexts(assortmentMediaId: $assortmentMediaId) {
              _id
            }
          }
        `,
        variables: {
          assortmentMediaId: 'non-existing-media-id',
        },
      });

      assert.equal(translatedAssortmentMediaTexts.length, 0);
    });
  });

  test.describe('Query.translatedAssortmentMediaTexts for anonymous user should', async () => {
    test('return list of assortment media texts when existing id is passed', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentMediaTexts($assortmentMediaId: ID!) {
            translatedAssortmentMediaTexts(assortmentMediaId: $assortmentMediaId) {
              _id
              locale
              title
              subtitle
            }
          }
        `,
        variables: {
          assortmentMediaId: PngAssortmentMedia._id,
        },
      });
      assert.equal(errors[0].extensions?.code, 'NoPermissionError');
    });
  });
});
