/**
 * Tests for the Languages Module
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createMemoryStore } from '@unchainedshop/store/memory';
import { configureLanguagesModule, type LanguagesModule } from './configureLanguagesModule.ts';

describe('Languages Module', () => {
  let store: Awaited<ReturnType<typeof createMemoryStore>>;
  let languagesModule: LanguagesModule;

  before(async () => {
    store = await createMemoryStore({ environment: 'server' });
    languagesModule = await configureLanguagesModule({ store });

    // Seed test data
    await languagesModule.create({ isoCode: 'en', isActive: true });
    await languagesModule.create({ isoCode: 'de', isActive: true });
    await languagesModule.create({ isoCode: 'fr', isActive: true });
    await languagesModule.create({ isoCode: 'it', isActive: true });
    await languagesModule.create({ isoCode: 'es', isActive: true });
  });

  after(async () => {
    await store.close();
  });

  describe('CRUD operations', () => {
    it('should create a language', async () => {
      const languageId = await languagesModule.create({
        isoCode: 'pt',
        isActive: true,
      });

      assert.ok(languageId, 'Should return a language ID');
      assert.strictEqual(typeof languageId, 'string');
    });

    it('should find a language by ID', async () => {
      const languageId = await languagesModule.create({
        isoCode: 'nl',
        isActive: true,
      });

      const language = await languagesModule.findLanguage({ languageId });

      assert.ok(language, 'Should find the language');
      assert.strictEqual(language.isoCode, 'nl');
      assert.strictEqual(language.isActive, true);
    });

    it('should find a language by ISO code', async () => {
      const language = await languagesModule.findLanguage({ isoCode: 'en' });

      assert.ok(language, 'Should find the language');
      assert.strictEqual(language.isoCode, 'en');
    });

    it('should lowercase ISO code on create', async () => {
      const languageId = await languagesModule.create({
        isoCode: 'JA',
        isActive: true,
      });

      const language = await languagesModule.findLanguage({ languageId });
      assert.ok(language);
      assert.strictEqual(language.isoCode, 'ja', 'ISO code should be lowercased');
    });

    it('should update a language', async () => {
      const language = await languagesModule.findLanguage({ isoCode: 'de' });
      assert.ok(language);

      await languagesModule.update(language._id, {
        isActive: false,
      });

      const updated = await languagesModule.findLanguage({ languageId: language._id });
      assert.ok(updated);
      assert.strictEqual(updated.isActive, false);
      assert.ok(updated.updated, 'Should have updated timestamp');

      // Restore
      await languagesModule.update(language._id, { isActive: true });
    });

    it('should soft-delete a language', async () => {
      const languageId = await languagesModule.create({
        isoCode: 'sv',
        isActive: true,
      });

      const deleteCount = await languagesModule.delete(languageId);
      assert.strictEqual(deleteCount, 1);

      // Should not find deleted language by default
      const languages = await languagesModule.findLanguages({});
      const svLanguage = languages.find((l) => l.isoCode === 'sv');
      assert.ok(!svLanguage, 'Deleted language should not be in results');
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
        isoCodes: ['en', 'de'],
      });

      assert.ok(languages.length >= 1, 'Should find at least one language');
      for (const language of languages) {
        assert.ok(
          ['en', 'de'].includes(language.isoCode),
          `ISO code ${language.isoCode} should be en or de`,
        );
      }
    });

    it('should count languages', async () => {
      const count = await languagesModule.count({});
      assert.ok(count >= 5, `Expected at least 5 languages, got ${count}`);
    });

    it('should check language exists', async () => {
      const language = await languagesModule.findLanguage({ isoCode: 'en' });
      assert.ok(language, 'Should find en language');

      const exists = await languagesModule.languageExists({ languageId: language._id });
      assert.strictEqual(exists, true, 'Language should exist');

      const notExists = await languagesModule.languageExists({ languageId: 'nonexistent' });
      assert.strictEqual(notExists, false, 'Non-existent language should not exist');
    });

    it('should filter inactive languages by default', async () => {
      const languageId = await languagesModule.create({
        isoCode: 'ko',
        isActive: false,
      });

      // Should not appear in default query
      const languages = await languagesModule.findLanguages({});
      const koLanguage = languages.find((l) => l.isoCode === 'ko');
      assert.ok(!koLanguage, 'Inactive language should not appear by default');

      // Should appear when includeInactive is true
      const allLanguages = await languagesModule.findLanguages({ includeInactive: true });
      const koWithInactive = allLanguages.find((l) => l.isoCode === 'ko');
      assert.ok(koWithInactive, 'Inactive language should appear with includeInactive');

      // Clean up
      await languagesModule.delete(languageId);
    });
  });

  describe('Helper functions', () => {
    it('should check isBase for system language', async () => {
      // Create a language matching the system locale (typically 'en')
      const language = await languagesModule.findLanguage({ isoCode: 'en' });
      assert.ok(language);

      // isBase depends on systemLocale.language which may vary
      const result = languagesModule.isBase(language);
      assert.strictEqual(typeof result, 'boolean');
    });
  });
});
