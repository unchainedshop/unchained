import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { userSettings } from './users-settings.ts';

const makeDb = (count: number) =>
  ({
    collection: () => ({
      countDocuments: async () => count,
    }),
  }) as any;

describe('defaultValidateEmail', () => {
  describe('format validation', () => {
    before(() => {
      userSettings.configureSettings({}, makeDb(0));
    });

    it('returns EMAIL_FORMAT_INVALID when email has no @', async () => {
      const result = await userSettings.validateEmail('notanemail');
      assert.deepStrictEqual(result, { valid: false, reason: 'EMAIL_FORMAT_INVALID' });
    });

    it('returns EMAIL_FORMAT_INVALID for empty string', async () => {
      const result = await userSettings.validateEmail('');
      assert.deepStrictEqual(result, { valid: false, reason: 'EMAIL_FORMAT_INVALID' });
    });

    it('returns valid: true for a correctly formatted new email', async () => {
      const result = await userSettings.validateEmail('new@example.com');
      assert.deepStrictEqual(result, { valid: true });
    });
  });

  describe('duplicate detection', () => {
    before(() => {
      userSettings.configureSettings({}, makeDb(1));
    });

    it('returns EMAIL_ALREADY_EXISTS when email is taken', async () => {
      const result = await userSettings.validateEmail('existing@example.com');
      assert.deepStrictEqual(result, { valid: false, reason: 'EMAIL_ALREADY_EXISTS' });
    });
  });
});

describe('defaultValidateUsername', () => {
  describe('length validation', () => {
    before(() => {
      userSettings.configureSettings({}, makeDb(0));
    });

    it('returns USERNAME_TOO_SHORT for a 2-character username', async () => {
      const result = await userSettings.validateUsername('ab');
      assert.deepStrictEqual(result, { valid: false, reason: 'USERNAME_TOO_SHORT' });
    });

    it('returns USERNAME_TOO_SHORT for empty string', async () => {
      const result = await userSettings.validateUsername('');
      assert.deepStrictEqual(result, { valid: false, reason: 'USERNAME_TOO_SHORT' });
    });

    it('returns valid: true for a username of exactly 3 characters', async () => {
      const result = await userSettings.validateUsername('abc');
      assert.deepStrictEqual(result, { valid: true });
    });

    it('returns valid: true for a longer valid username', async () => {
      const result = await userSettings.validateUsername('newuser');
      assert.deepStrictEqual(result, { valid: true });
    });
  });

  describe('duplicate detection', () => {
    before(() => {
      userSettings.configureSettings({}, makeDb(1));
    });

    it('returns USERNAME_ALREADY_EXISTS when username is taken', async () => {
      const result = await userSettings.validateUsername('existinguser');
      assert.deepStrictEqual(result, { valid: false, reason: 'USERNAME_ALREADY_EXISTS' });
    });
  });
});
