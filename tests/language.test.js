import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  disconnect,
  createAnonymousGraphqlFetch,
  getDrizzleDb,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { BaseLanguage, ItalianLanguage, InactiveLanguage } from './seeds/locale-data.js';
import { languages } from '@unchainedshop/core-languages';
import { eq, sql, isNull, and } from 'drizzle-orm';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Language', () => {
  let graphqlFetch;
  let graphqlFetchAsNormalUser;
  let graphqlFetchAsAnonymousUser;
  let drizzleDb;
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
    drizzleDb = getDrizzleDb();
  });

  test.after(async () => {
    await disconnect();
  });
  test.describe('Query.languages for admin user', () => {
    test('Return all active languages when no arguments passed', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages {
            languages {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(languages.length, 3);
    });

    test('Return all languages with all fields', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages {
            languages {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(languages.length, 3);
      assert.ok(languages.every((l) => typeof l._id === 'string'));
      assert.ok(languages.every((l) => typeof l.isoCode === 'string'));
      assert.ok(languages.every((l) => typeof l.isActive === 'boolean'));
    });

    test('Return all languages including inactive', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($includeInactive: Boolean) {
            languages(includeInactive: $includeInactive) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          includeInactive: true,
        },
      });
      assert.strictEqual(languages.length, 4);
      const inactiveLanguage = languages.find((l) => l._id === InactiveLanguage._id);
      assert.strictEqual(inactiveLanguage.isActive, false);
    });

    test('Return languages with limit', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($limit: Int) {
            languages(limit: $limit) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          limit: 2,
        },
      });
      assert.strictEqual(languages.length, 2);
    });

    test('Return languages with offset', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($offset: Int) {
            languages(offset: $offset) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          offset: 1,
        },
      });
      assert.strictEqual(languages.length, 2);
    });

    test('Return languages with limit and offset', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($limit: Int, $offset: Int) {
            languages(limit: $limit, offset: $offset) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          limit: 1,
          offset: 1,
        },
      });
      assert.strictEqual(languages.length, 1);
    });

    test('Return language search result', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($queryString: String) {
            languages(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'de',
        },
      });
      assert.strictEqual(languages.length, 1);
      assert.deepStrictEqual(languages, [
        {
          _id: BaseLanguage._id,
          isoCode: BaseLanguage.isoCode,
        },
      ]);
    });

    test('Return languages sorted by isoCode ascending', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($sort: [SortOptionInput!]) {
            languages(sort: $sort) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          sort: [{ key: 'isoCode', value: 'ASC' }],
        },
      });
      assert.strictEqual(languages.length, 3);
      assert.strictEqual(languages[0]._id, BaseLanguage._id);
      assert.strictEqual(languages[2]._id, ItalianLanguage._id);
    });

    test('Return languages sorted by isoCode descending', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($sort: [SortOptionInput!]) {
            languages(sort: $sort) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          sort: [{ key: 'isoCode', value: 'DESC' }],
        },
      });
      assert.strictEqual(languages.length, 3);
      assert.strictEqual(languages[0]._id, ItalianLanguage._id);
      assert.strictEqual(languages[2]._id, BaseLanguage._id);
    });

    test('Return empty array when no matching search result found', async () => {
      const {
        data: { languages },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Languages($queryString: String) {
            languages(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(languages.length, 0);
    });
  });

  test.describe('Query.languages for normal user', () => {
    test('Return all active languages', async () => {
      const {
        data: { languages },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Languages {
            languages {
              _id
              isoCode
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(languages.length, 3);
    });

    test('Return language search result', async () => {
      const {
        data: { languages },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Languages($queryString: String) {
            languages(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'de',
        },
      });
      assert.strictEqual(languages.length, 1);
      assert.deepStrictEqual(languages, [
        {
          _id: BaseLanguage._id,
          isoCode: BaseLanguage.isoCode,
        },
      ]);
    });

    test('Return empty array when no matching search result found', async () => {
      const {
        data: { languages },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Languages($queryString: String) {
            languages(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(languages.length, 0);
    });
  });

  test.describe('Query.languages for anonymous user', () => {
    test('Return all active languages', async () => {
      const {
        data: { languages },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Languages {
            languages {
              _id
              isoCode
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(languages.length, 3);
    });

    test('Return language search result', async () => {
      const {
        data: { languages },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Languages($queryString: String) {
            languages(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'de',
        },
      });
      assert.strictEqual(languages.length, 1);
      assert.deepStrictEqual(languages, [
        {
          _id: BaseLanguage._id,
          isoCode: BaseLanguage.isoCode,
        },
      ]);
    });

    test('Return empty array when no matching search result found', async () => {
      const {
        data: { languages },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Languages($queryString: String) {
            languages(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(languages.length, 0);
    });
  });

  test.describe('query.language for anonymous user', () => {
    test('returns a language by ID', async () => {
      const {
        data: { language },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Language($languageId: ID!) {
            language(languageId: $languageId) {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `,
        variables: { languageId: 'de' },
      });

      assert.strictEqual(language._id, 'de');
      assert.strictEqual(language.isoCode, 'de');
      assert.strictEqual(typeof language.isActive, 'boolean');
      assert.strictEqual(typeof language.isBase, 'boolean');
      assert.strictEqual(typeof language.name, 'string');
    });

    test('returns null for a non-existent language ID', async () => {
      const {
        data: { language },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Language($languageId: ID!) {
            language(languageId: $languageId) {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `,
        variables: { languageId: 'nonexistent_lang' },
      });

      assert.strictEqual(language, null);
    });
  });

  test.describe('query.language for admin user', () => {
    test('returns a language by ID', async () => {
      const {
        data: { language },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Language($languageId: ID!) {
            language(languageId: $languageId) {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `,
        variables: { languageId: 'de' },
      });

      assert.strictEqual(language._id, 'de');
      assert.strictEqual(language.isoCode, 'de');
      assert.strictEqual(typeof language.isActive, 'boolean');
      assert.strictEqual(typeof language.isBase, 'boolean');
      assert.strictEqual(typeof language.name, 'string');
    });

    test('returns null for a non-existent language ID', async () => {
      const {
        data: { language },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Language($languageId: ID!) {
            language(languageId: $languageId) {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `,
        variables: { languageId: 'nonexistent_lang' },
      });

      assert.strictEqual(language, null);
    });
  });

  test.describe('query.language for normal user', () => {
    test('returns a language by ID', async () => {
      const {
        data: { language },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Language($languageId: ID!) {
            language(languageId: $languageId) {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `,
        variables: { languageId: 'de' },
      });

      assert.strictEqual(language._id, 'de');
      assert.strictEqual(language.isoCode, 'de');
      assert.strictEqual(typeof language.isActive, 'boolean');
      assert.strictEqual(typeof language.isBase, 'boolean');
      assert.strictEqual(typeof language.name, 'string');
    });

    test('returns null for a non-existent language ID', async () => {
      const {
        data: { language },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Language($languageId: ID!) {
            language(languageId: $languageId) {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `,
        variables: { languageId: 'nonexistent_lang' },
      });

      assert.strictEqual(language, null);
    });
  });

  test.describe('Query.languagesCount for admin user', () => {
    test('Return count of all active languages when no arguments passed', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            languagesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(languagesCount, 3);
    });

    test('Return count of all languages including inactive', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query LanguagesCount($includeInactive: Boolean) {
            languagesCount(includeInactive: $includeInactive)
          }
        `,
        variables: {
          includeInactive: true,
        },
      });
      assert.strictEqual(languagesCount, 4);
    });

    test('Return count of languages filtered by queryString', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query LanguagesCount($queryString: String) {
            languagesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'de',
        },
      });
      assert.strictEqual(languagesCount, 1);
    });

    test('Return count with combined filters', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query LanguagesCount($includeInactive: Boolean, $queryString: String) {
            languagesCount(includeInactive: $includeInactive, queryString: $queryString)
          }
        `,
        variables: {
          includeInactive: true,
          queryString: 'fr',
        },
      });
      assert.strictEqual(languagesCount, 1);
    });

    test('Return 0 for non-matching queryString', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query LanguagesCount($queryString: String) {
            languagesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(languagesCount, 0);
    });
  });

  test.describe('Query.languagesCount for normal user', () => {
    test('Return count of all active languages', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            languagesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(languagesCount, 3);
    });

    test('Return count of languages filtered by queryString', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query LanguagesCount($queryString: String) {
            languagesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'en',
        },
      });
      assert.strictEqual(languagesCount, 1);
    });
  });

  test.describe('Query.languagesCount for anonymous user', () => {
    test('Return count of all active languages', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            languagesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(languagesCount, 3);
    });

    test('Return count of languages filtered by queryString', async () => {
      const {
        data: { languagesCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query LanguagesCount($queryString: String) {
            languagesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'en',
        },
      });
      assert.strictEqual(languagesCount, 1);
    });
  });

  test.describe('Mutation.language', () => {
    test('add a language', async () => {
      const { data: { createLanguage } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createLanguage(language: { isoCode: "am" }) {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `,
      });
      assert.partialDeepStrictEqual(createLanguage, {
        isoCode: 'am',
        isActive: true,
        isBase: false,
        name: 'am',
      });
      await drizzleDb.delete(languages).where(eq(languages.isoCode, 'am'));
    });

    test('update a language', async () => {
      const [language] = await drizzleDb.select().from(languages).limit(1);

      const { data: { updateLanguage } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateLanguage($languageId: ID!, $language: UpdateLanguageInput!) {
            updateLanguage(languageId: $languageId, language: $language) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          languageId: language._id,
          language: {
            isoCode: 'ar',
            isActive: true,
          },
        },
      });
      assert.strictEqual(errors, undefined);
      assert.partialDeepStrictEqual(updateLanguage, {
        isoCode: 'ar',
        isActive: true,
      });
    });

    test('return not found error when passed non existing languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateLanguage($languageId: ID!, $language: UpdateLanguageInput!) {
            updateLanguage(languageId: $languageId, language: $language) {
              _id
            }
          }
        `,
        variables: {
          languageId: 'non-existing-id',
          language: {
            isoCode: 'de',
            isActive: true,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'LanguageNotFoundError');
    });

    test('return error when passed invalid languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateLanguage($languageId: ID!, $language: UpdateLanguageInput!) {
            updateLanguage(languageId: $languageId, language: $language) {
              _id
            }
          }
        `,
        variables: {
          languageId: '',
          language: {
            isoCode: 'de',
            isActive: true,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('remove a language', async () => {
      await drizzleDb.insert(languages).values({ _id: 'am', isoCode: 'AM', created: new Date() });
      const { data: { removeLanguage } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeLanguage(languageId: "am") {
              _id
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors, undefined);
      assert.partialDeepStrictEqual(removeLanguage, {
        isoCode: 'AM',
      });
      const [notDeletedCount] = await drizzleDb
        .select({ count: sql`count(*)` })
        .from(languages)
        .where(and(eq(languages._id, 'am'), isNull(languages.deleted)));
      assert.strictEqual(Number(notDeletedCount.count), 0);
      const [totalCount] = await drizzleDb
        .select({ count: sql`count(*)` })
        .from(languages)
        .where(eq(languages._id, 'am'));
      assert.strictEqual(Number(totalCount.count), 1);
      await drizzleDb.delete(languages).where(eq(languages._id, 'am'));
    });

    test('return not found error when passed non existing languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeLanguage(languageId: "AMH") {
              _id
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'LanguageNotFoundError');
    });

    test('return error when passed invalid languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeLanguage(languageId: "") {
              _id
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('query active languages', async () => {
      await drizzleDb.insert(languages).values({
        _id: 'es',
        isoCode: 'es',
        isActive: true,
        created: new Date(),
      });
      await drizzleDb.insert(languages).values({
        _id: 'ru',
        isoCode: 'ru',
        isActive: false,
        created: new Date(),
      });

      const { data: { languages: languagesData } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            languages {
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors, undefined);
      assert.ok(languagesData.length >= 2);
      await drizzleDb.delete(languages).where(eq(languages._id, 'es'));
      await drizzleDb.delete(languages).where(eq(languages._id, 'ru'));
    });

    test('query inactive single language', async () => {
      await drizzleDb.insert(languages).values({
        _id: 'pl',
        isoCode: 'pl',
        isActive: false,
        created: new Date(),
      });

      const { data: { language } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            language(languageId: "pl") {
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(language, {
        isoCode: 'pl',
      });
      await drizzleDb.delete(languages).where(eq(languages._id, 'pl'));
    });

    test('query.language return error when passed invalid languageId', async () => {
      const { data: { language } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            language(languageId: "") {
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(language, null);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
