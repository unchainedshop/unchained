/**
 * Tests for the Languages Module with Drizzle ORM
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createTestDb, type DrizzleDbConnection } from '@unchainedshop/store';
import { initializeLanguagesSchema } from '../db/index.ts';
import { configureLanguagesModule, type LanguagesModule } from './configureLanguagesModule.ts';

describe('Languages Module', () => {
  let connection: DrizzleDbConnection;
  let languagesModule: LanguagesModule;

  before(async () => {
    // Create in-memory SQLite database for testing
    connection = createTestDb();
    await initializeLanguagesSchema(connection.db);

    languagesModule = await configureLanguagesModule({ db: connection.db });

    // Seed test data
    await languagesModule.create({ isoCode: 'de' });
    await languagesModule.create({ isoCode: 'en' });
    await languagesModule.create({ isoCode: 'fr' });
    await languagesModule.create({ isoCode: 'it' });
    await languagesModule.create({ isoCode: 'es' });
  });

  after(async () => {
    connection.close();
  });

  describe('CRUD operations', () => {
    it('should create a language', async () => {
      const languageId = await languagesModule.create({
        isoCode: 'pt',
      });

      assert.ok(languageId, 'Should return a language ID');
      assert.strictEqual(typeof languageId, 'string');
    });

    it('should find a language by ID', async () => {
      const languageId = await languagesModule.create({
        isoCode: 'ja',
      });

      const language = await languagesModule.findLanguage({ languageId });

      assert.ok(language, 'Should find the language');
      assert.strictEqual(language.isoCode, 'ja');
      assert.strictEqual(language.isActive, true);
    });

    it('should find a language by ISO code', async () => {
      const language = await languagesModule.findLanguage({ isoCode: 'de' });

      assert.ok(language, 'Should find the language');
      assert.strictEqual(language.isoCode, 'de');
    });

    it('should update a language', async () => {
      const language = await languagesModule.findLanguage({ isoCode: 'en' });
      assert.ok(language);

      await languagesModule.update(language._id, {
        isActive: false,
      });

      const updated = await languagesModule.findLanguage({ languageId: language._id });
      assert.ok(updated);
      assert.strictEqual(updated.isActive, false);
      assert.ok(updated.updated, 'Should have updated timestamp');
    });

    it('should soft-delete a language', async () => {
      const languageId = await languagesModule.create({
        isoCode: 'nl',
      });

      const deleteCount = await languagesModule.delete(languageId);
      assert.strictEqual(deleteCount, 1);

      // Should not find deleted language by default
      const languages = await languagesModule.findLanguages({});
      const nlLanguage = languages.find((l) => l.isoCode === 'nl');
      assert.ok(!nlLanguage, 'Deleted language should not be in results');
    });
  });

  describe('Query operations', () => {
    it('should find languages with pagination', async () => {
      const firstPage = await languagesModule.findLanguages({ limit: 2, offset: 0 });
      assert.strictEqual(firstPage.length, 2, 'First page should have 2 languages');

      const secondPage = await languagesModule.findLanguages({ limit: 2, offset: 2 });
      assert.ok(secondPage.length >= 1, 'Second page should have at least 1 language');
    });

    it('should filter by ISO codes', async () => {
      const languages = await languagesModule.findLanguages({
        isoCodes: ['de', 'en'],
        includeInactive: true,
      });

      assert.ok(languages.length >= 1, 'Should find at least one language');
      for (const language of languages) {
        assert.ok(
          ['de', 'en'].includes(language.isoCode),
          `ISO code ${language.isoCode} should be de or en`,
        );
      }
    });

    it('should count languages', async () => {
      const count = await languagesModule.count({});
      assert.ok(count >= 4, `Expected at least 4 languages, got ${count}`);
    });

    it('should check language exists', async () => {
      const language = await languagesModule.findLanguage({ isoCode: 'de' });
      assert.ok(language, 'Should find de language');

      const exists = await languagesModule.languageExists({ languageId: language._id });
      assert.strictEqual(exists, true, 'Language should exist');

      const notExists = await languagesModule.languageExists({ languageId: 'nonexistent' });
      assert.strictEqual(notExists, false, 'Non-existent language should not exist');
    });
  });

  describe('Full-text search', () => {
    it('should search languages by text', async () => {
      const languages = await languagesModule.findLanguages({
        queryString: 'de',
      });

      assert.ok(languages.length >= 1, 'Should find at least one language');
      const deLanguage = languages.find((l) => l.isoCode === 'de');
      assert.ok(deLanguage, 'Should find de language via FTS');
    });

    it('should return empty array for no FTS matches', async () => {
      const languages = await languagesModule.findLanguages({
        queryString: 'ZZZZNONEXISTENT',
      });

      assert.strictEqual(languages.length, 0, 'Should return empty array for no matches');
    });
  });

  describe('Helper functions', () => {
    it('should check if language is base', async () => {
      // The system locale is typically 'de-CH', so 'de' should be base
      const language = await languagesModule.findLanguage({ isoCode: 'de' });
      assert.ok(language);

      const isBase = languagesModule.isBase(language);
      assert.strictEqual(isBase, true, 'de should be the base language');
    });
  });

  describe('Field projection', () => {
    it('should return only specified fields', async () => {
      const languages = await languagesModule.findLanguages({}, { fields: ['isoCode', 'isActive'] });

      assert.ok(languages.length >= 1, 'Should find at least one language');
      const language = languages[0];

      // Should have the requested fields
      assert.ok('isoCode' in language, 'Should have isoCode');
      assert.ok('isActive' in language, 'Should have isActive');

      // Should NOT have other fields
      assert.ok(!('created' in language), 'Should not have created');
      assert.ok(!('updated' in language), 'Should not have updated');
    });

    it('should return all fields when no projection specified', async () => {
      const languages = await languagesModule.findLanguages({});

      assert.ok(languages.length >= 1, 'Should find at least one language');
      const language = languages[0];

      // Should have all fields
      assert.ok('_id' in language, 'Should have _id');
      assert.ok('isoCode' in language, 'Should have isoCode');
      assert.ok('created' in language, 'Should have created');
      assert.ok('isActive' in language, 'Should have isActive');
    });
  });

  describe('Sorting', () => {
    it('should sort languages by isoCode ascending', async () => {
      const languages = await languagesModule.findLanguages({
        sort: [{ key: 'isoCode', value: 'ASC' }],
        includeInactive: true,
      });

      assert.ok(languages.length >= 2, 'Should have at least 2 languages');

      // Check that languages are sorted ascending by isoCode
      for (let i = 1; i < languages.length; i++) {
        assert.ok(
          languages[i].isoCode >= languages[i - 1].isoCode,
          `${languages[i].isoCode} should be >= ${languages[i - 1].isoCode}`,
        );
      }
    });

    it('should sort languages by isoCode descending', async () => {
      const languages = await languagesModule.findLanguages({
        sort: [{ key: 'isoCode', value: 'DESC' }],
        includeInactive: true,
      });

      assert.ok(languages.length >= 2, 'Should have at least 2 languages');

      // Check that languages are sorted descending by isoCode
      for (let i = 1; i < languages.length; i++) {
        assert.ok(
          languages[i].isoCode <= languages[i - 1].isoCode,
          `${languages[i].isoCode} should be <= ${languages[i - 1].isoCode}`,
        );
      }
    });
  });
});
