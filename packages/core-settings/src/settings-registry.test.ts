import { describe, it } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';
import {
  registerSettingsNamespace,
  getSettingsNamespace,
  getAllSettingsNamespaces,
} from './settings-registry.ts';

describe('settings-registry', () => {
  const testSchema = z.object({ enabled: z.boolean().default(false) });

  describe('registerSettingsNamespace', () => {
    it('registers a namespace successfully', () => {
      registerSettingsNamespace({
        key: 'reg-test-1',
        schema: testSchema,
      });
      const ns = getSettingsNamespace('reg-test-1');
      assert.strictEqual(ns?.key, 'reg-test-1');
    });

    it('registers a namespace with public flag and defaults', () => {
      registerSettingsNamespace({
        key: 'reg-test-2',
        schema: testSchema,
        public: true,
        defaults: { enabled: true },
      });
      const ns = getSettingsNamespace('reg-test-2');
      assert.strictEqual(ns?.public, true);
      assert.deepStrictEqual(ns?.defaults, { enabled: true });
    });

    it('throws on duplicate key', () => {
      registerSettingsNamespace({
        key: 'reg-test-dup',
        schema: testSchema,
      });
      assert.throws(
        () => registerSettingsNamespace({ key: 'reg-test-dup', schema: testSchema }),
        /already registered/,
      );
    });
  });

  describe('getSettingsNamespace', () => {
    it('returns undefined for unknown key', () => {
      assert.strictEqual(getSettingsNamespace('nonexistent-key'), undefined);
    });

    it('returns the definition for a registered key', () => {
      registerSettingsNamespace({ key: 'get-test-1', schema: testSchema, public: false });
      const def = getSettingsNamespace('get-test-1');
      assert.strictEqual(def?.key, 'get-test-1');
      assert.strictEqual(def?.public, false);
      assert.strictEqual(def?.schema, testSchema);
    });
  });

  describe('getAllSettingsNamespaces', () => {
    it('returns an array containing all registered namespaces', () => {
      const all = getAllSettingsNamespaces();
      assert.ok(Array.isArray(all));
      const keys = all.map((d) => d.key);
      assert.ok(keys.includes('reg-test-1'));
      assert.ok(keys.includes('reg-test-2'));
      assert.ok(keys.includes('reg-test-dup'));
      assert.ok(keys.includes('get-test-1'));
    });

    it('returns definitions with correct shape', () => {
      const all = getAllSettingsNamespaces();
      for (const def of all) {
        assert.strictEqual(typeof def.key, 'string');
        assert.ok(def.schema);
      }
    });
  });
});
