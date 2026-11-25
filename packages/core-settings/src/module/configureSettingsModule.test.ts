import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';
import { registerSettingsNamespace } from '../settings-registry.ts';
import { configureSettingsModule } from './configureSettingsModule.ts';

const store = new Map<string, any>();

function mockCollection() {
  return {
    findOne: async (filter: Record<string, unknown>) => {
      for (const doc of store.values()) {
        if (Object.entries(filter).every(([k, v]) => doc[k] === v)) return doc;
      }
      return null;
    },
    insertOne: async (doc: any) => {
      store.set(doc._id, { ...doc });
      return { insertedId: doc._id };
    },
    updateOne: async (
      filter: Record<string, unknown>,
      update: Record<string, any>,
      options?: { upsert?: boolean },
    ) => {
      let existing: any = null;
      for (const doc of store.values()) {
        if (Object.entries(filter).every(([k, v]) => doc[k] === v)) {
          existing = doc;
          break;
        }
      }
      if (existing) {
        if (update.$set) Object.assign(existing, update.$set);
        return { matchedCount: 1, modifiedCount: 1, upsertedId: null };
      }
      if (options?.upsert) {
        const newDoc = { ...filter, ...update.$setOnInsert, ...update.$set };
        store.set(newDoc._id, newDoc);
        return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id };
      }
      return { matchedCount: 0, modifiedCount: 0, upsertedId: null };
    },
  };
}

const mockDb = {
  collection: () => mockCollection(),
  createIndex: async () => 'ok',
} as any;

const themeSchema = z.object({
  primaryColor: z.string().default('#000000'),
  darkMode: z.boolean().default(false),
});

const notifSchema = z.object({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
});

const noDefaultSchema = z.object({
  apiKey: z.string(),
});

before(() => {
  registerSettingsNamespace({
    key: 'mod-theme',
    schema: themeSchema,
    public: true,
    defaults: { primaryColor: '#ff0000', darkMode: false },
  });
  registerSettingsNamespace({
    key: 'mod-notifications',
    schema: notifSchema,
    public: false,
    defaults: { emailEnabled: true, smsEnabled: false },
  });
  registerSettingsNamespace({
    key: 'mod-no-defaults',
    schema: noDefaultSchema,
    public: false,
  });
});

describe('configureSettingsModule', () => {
  let settings: Awaited<ReturnType<typeof configureSettingsModule>>;

  before(async () => {
    store.clear();
    settings = await configureSettingsModule({ db: mockDb, migrationRepository: {} as any });
  });

  describe('get', () => {
    it('returns schema defaults when no DB document exists but namespace is registered', async () => {
      const val = await settings.get('mod-theme');
      assert.deepStrictEqual(val, { primaryColor: '#000000', darkMode: false });
    });

    it('returns null for unregistered namespace', async () => {
      const val = await settings.get('nonexistent');
      assert.strictEqual(val, null);
    });

    it('returns value from DB when document exists', async () => {
      store.set('theme-doc', {
        _id: 'theme-doc',
        namespace: 'mod-theme',
        value: { primaryColor: '#123456', darkMode: true },
        created: new Date(),
      });
      settings = await configureSettingsModule({ db: mockDb, migrationRepository: {} as any });
      const val = await settings.get('mod-theme');
      assert.deepStrictEqual(val, { primaryColor: '#123456', darkMode: true });
    });

    it('caches results across calls', async () => {
      let findCount = 0;
      const countingDb = {
        collection: () => ({
          ...mockCollection(),
          findOne: async (filter: any) => {
            findCount++;
            return {
              _id: 'c',
              namespace: filter.namespace,
              value: { primaryColor: '#aaa', darkMode: false },
            };
          },
        }),
      } as any;
      const cached = await configureSettingsModule({ db: countingDb, migrationRepository: {} as any });
      await cached.get('mod-theme');
      await cached.get('mod-theme');
      assert.strictEqual(findCount, 1);
    });
  });

  describe('set', () => {
    before(async () => {
      store.clear();
      settings = await configureSettingsModule({ db: mockDb, migrationRepository: {} as any });
    });

    it('validates and stores value for registered namespace', async () => {
      const result = await settings.set('mod-theme', { primaryColor: '#abcdef', darkMode: true });
      assert.deepStrictEqual(result, { primaryColor: '#abcdef', darkMode: true });
      const fromGet = await settings.get('mod-theme');
      assert.deepStrictEqual(fromGet, { primaryColor: '#abcdef', darkMode: true });
    });

    it('applies schema defaults for missing fields', async () => {
      const result = await settings.set('mod-notifications', { emailEnabled: false });
      assert.strictEqual(result.emailEnabled, false);
      assert.strictEqual(result.smsEnabled, false);
    });

    it('throws for unregistered namespace', async () => {
      await assert.rejects(() => settings.set('nonexistent', { foo: 'bar' }), /not registered/);
    });

    it('throws on schema validation failure', async () => {
      await assert.rejects(
        () => settings.set('mod-no-defaults', { apiKey: 123 as any }),
        (err: any) => err.name === 'ZodError',
      );
    });

    it('evicts cache so next get reflects new value', async () => {
      await settings.set('mod-theme', { primaryColor: '#111111', darkMode: false });
      const val = await settings.get('mod-theme');
      assert.strictEqual(val?.primaryColor, '#111111');
      await settings.set('mod-theme', { primaryColor: '#222222', darkMode: true });
      const val2 = await settings.get('mod-theme');
      assert.strictEqual(val2?.primaryColor, '#222222');
    });

    it('generates a string _id on upsert', async () => {
      store.clear();
      settings = await configureSettingsModule({ db: mockDb, migrationRepository: {} as any });
      await settings.set('mod-theme', { primaryColor: '#999', darkMode: false });
      const doc = Array.from(store.values()).find((d) => d.namespace === 'mod-theme');
      assert.ok(doc, 'document should exist in store');
      assert.strictEqual(typeof doc._id, 'string');
      assert.ok(doc._id.length > 0);
    });
  });

  describe('getJsonSchema', () => {
    it('returns JSON schema for registered namespace', () => {
      const schema = settings.getJsonSchema('mod-theme');
      assert.ok(schema);
      assert.strictEqual(schema.type, 'object');
      assert.ok((schema as any).properties?.primaryColor);
      assert.ok((schema as any).properties?.darkMode);
    });

    it('returns null for unregistered namespace', () => {
      assert.strictEqual(settings.getJsonSchema('nonexistent'), null);
    });
  });

  describe('isPublic', () => {
    it('returns true for public namespace', () => {
      assert.strictEqual(settings.isPublic('mod-theme'), true);
    });

    it('returns false for non-public namespace', () => {
      assert.strictEqual(settings.isPublic('mod-notifications'), false);
    });

    it('returns false for unregistered namespace', () => {
      assert.strictEqual(settings.isPublic('nonexistent'), false);
    });
  });

  describe('getRegisteredNamespaces', () => {
    it('returns array of all registered namespace keys', () => {
      const keys = settings.getRegisteredNamespaces();
      assert.ok(keys.includes('mod-theme'));
      assert.ok(keys.includes('mod-notifications'));
      assert.ok(keys.includes('mod-no-defaults'));
    });
  });

  describe('getNamespaceDefinition', () => {
    it('returns definition for registered namespace', () => {
      const def = settings.getNamespaceDefinition('mod-theme');
      assert.ok(def);
      assert.strictEqual(def.key, 'mod-theme');
      assert.strictEqual(def.public, true);
    });

    it('returns undefined for unregistered namespace', () => {
      assert.strictEqual(settings.getNamespaceDefinition('nonexistent'), undefined);
    });
  });

  describe('seed', () => {
    it('inserts defaults for namespaces that have defaults and no existing document', async () => {
      store.clear();
      settings = await configureSettingsModule({ db: mockDb, migrationRepository: {} as any });
      await settings.seed();
      const docs = Array.from(store.values());
      const themeDoc = docs.find((d) => d.namespace === 'mod-theme');
      assert.ok(themeDoc, 'theme document should be seeded');
      assert.deepStrictEqual(themeDoc.value, { primaryColor: '#ff0000', darkMode: false });
      assert.ok(themeDoc.created instanceof Date);
      assert.strictEqual(typeof themeDoc._id, 'string');
    });

    it('seeds all namespaces that have defaults', async () => {
      const docs = Array.from(store.values());
      const notifDoc = docs.find((d) => d.namespace === 'mod-notifications');
      assert.ok(notifDoc, 'notifications document should be seeded');
      assert.deepStrictEqual(notifDoc.value, { emailEnabled: true, smsEnabled: false });
    });

    it('skips namespaces without defaults', async () => {
      const docs = Array.from(store.values());
      const noDefaultDoc = docs.find((d) => d.namespace === 'mod-no-defaults');
      assert.strictEqual(noDefaultDoc, undefined);
    });

    it('does not overwrite existing documents', async () => {
      store.set('existing-theme', {
        _id: 'existing-theme',
        namespace: 'mod-theme',
        value: { primaryColor: '#custom', darkMode: true },
        created: new Date(),
      });
      settings = await configureSettingsModule({ db: mockDb, migrationRepository: {} as any });
      await settings.seed();
      const themeDoc = store.get('existing-theme');
      assert.strictEqual(themeDoc.value.primaryColor, '#custom');
    });
  });
});
