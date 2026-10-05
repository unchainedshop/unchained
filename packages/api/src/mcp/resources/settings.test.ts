import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getShopSettingsText, buildSettingsChatResourceContext } from './settings.ts';
import type { Context } from '../../context.ts';

const settingsContext = (overrides: Record<string, any> = {}) =>
  ({
    user: { _id: 'admin', roles: ['admin'] },
    modules: {
      settings: {
        getRegisteredNamespaces: () => ['theme', 'notifications'],
        get: async (ns: string) => {
          if (ns === 'theme') return { primaryColor: '#fff', darkMode: false };
          if (ns === 'notifications') return { emailEnabled: true };
          return null;
        },
        getNamespaceDefinition: (ns: string) => {
          if (ns === 'theme') return { key: 'theme', public: true };
          if (ns === 'notifications') return { key: 'notifications', public: false };
          return undefined;
        },
      },
      ...overrides,
    },
  }) as unknown as Context;

describe('getShopSettingsText', () => {
  it('returns JSON with all namespace entries', async () => {
    const text = await getShopSettingsText(settingsContext());
    const parsed = JSON.parse(text);
    assert.ok(Array.isArray(parsed.settings));
    assert.strictEqual(parsed.settings.length, 2);
    assert.strictEqual(parsed.settings[0].namespace, 'theme');
    assert.strictEqual(parsed.settings[0].public, true);
    assert.deepStrictEqual(parsed.settings[0].value, { primaryColor: '#fff', darkMode: false });
    assert.strictEqual(parsed.settings[1].namespace, 'notifications');
    assert.strictEqual(parsed.settings[1].public, false);
  });

  it('includes usage note in output', async () => {
    const text = await getShopSettingsText(settingsContext());
    const parsed = JSON.parse(text);
    assert.ok(parsed.note.includes('updateShopSettings'));
  });

  it('handles namespace with no definition gracefully', async () => {
    const ctx = settingsContext({
      settings: {
        getRegisteredNamespaces: () => ['unknown-ns'],
        get: async () => null,
        getNamespaceDefinition: () => undefined,
      },
    });
    const text = await getShopSettingsText(ctx);
    const parsed = JSON.parse(text);
    assert.strictEqual(parsed.settings[0].public, false);
    assert.strictEqual(parsed.settings[0].value, null);
  });
});

describe('buildSettingsChatResourceContext', () => {
  it('returns settings block for admin users', async () => {
    const result = await buildSettingsChatResourceContext(settingsContext());
    assert.match(result, /^shop-settings:\n/);
    assert.ok(result.includes('"theme"'));
    assert.ok(result.includes('"notifications"'));
  });

  it('returns empty string for undefined context', async () => {
    assert.strictEqual(await buildSettingsChatResourceContext(undefined), '');
  });

  it('returns empty string for non-admin user', async () => {
    const ctx = settingsContext();
    (ctx as any).user = { _id: 'user', roles: ['user'] };
    assert.strictEqual(await buildSettingsChatResourceContext(ctx), '');
  });

  it('returns empty string when user has no roles', async () => {
    const ctx = settingsContext();
    (ctx as any).user = { _id: 'user', roles: [] };
    assert.strictEqual(await buildSettingsChatResourceContext(ctx), '');
  });

  it('returns empty string when user is null', async () => {
    const ctx = settingsContext();
    (ctx as any).user = null;
    assert.strictEqual(await buildSettingsChatResourceContext(ctx), '');
  });

  it('returns empty string on error and does not throw', async () => {
    const ctx = settingsContext({
      settings: {
        getRegisteredNamespaces: () => {
          throw new Error('db down');
        },
      },
    });
    const result = await buildSettingsChatResourceContext(ctx);
    assert.strictEqual(result, '');
  });
});
