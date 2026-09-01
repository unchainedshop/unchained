import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { pluginRegistry } from './PluginRegistry.ts';

const adapterType = Symbol.for('unchained:adapter:test');
const otherAdapterType = Symbol.for('unchained:adapter:test-other');

const createAdapter = (key: string, orderIndex?: number) => ({
  key,
  label: key,
  version: '1.0.0',
  adapterType,
  orderIndex,
  asString: () => key,
  log: () => undefined,
});

const registerPluginWithAdapters = (key: string, adapters: ReturnType<typeof createAdapter>[]) => {
  pluginRegistry.register({ key, label: key, version: '1.0.0', adapters });
};

describe('PluginRegistry', () => {
  describe('getAdapters', () => {
    afterEach(() => {
      pluginRegistry.clear();
    });

    it('should sort adapters by ascending orderIndex across plugins', () => {
      registerPluginWithAdapters('plugin.tax', [createAdapter('tax', 80)]);
      registerPluginWithAdapters('plugin.base', [createAdapter('base', 0)]);
      registerPluginWithAdapters('plugin.discount', [createAdapter('discount', 30)]);

      const keys = pluginRegistry.getAdapters(adapterType).map((adapter) => adapter.key);
      assert.deepStrictEqual(keys, ['base', 'discount', 'tax']);
    });

    it('should treat missing orderIndex as 0', () => {
      registerPluginWithAdapters('plugin.a', [createAdapter('with-index', 10)]);
      registerPluginWithAdapters('plugin.b', [createAdapter('without-index')]);

      const keys = pluginRegistry.getAdapters(adapterType).map((adapter) => adapter.key);
      assert.deepStrictEqual(keys, ['without-index', 'with-index']);
    });

    it('should keep registration order for equal orderIndex (stable sort)', () => {
      registerPluginWithAdapters('plugin.first', [createAdapter('first', 10)]);
      registerPluginWithAdapters('plugin.second', [createAdapter('second'), createAdapter('third', 10)]);

      const keys = pluginRegistry.getAdapters(adapterType).map((adapter) => adapter.key);
      assert.deepStrictEqual(keys, ['second', 'first', 'third']);
    });

    it('should only return adapters matching the requested type', () => {
      registerPluginWithAdapters('plugin.mixed', [
        { ...createAdapter('other'), adapterType: otherAdapterType },
        createAdapter('matching'),
      ]);

      const keys = pluginRegistry.getAdapters(adapterType).map((adapter) => adapter.key);
      assert.deepStrictEqual(keys, ['matching']);
    });

    it('should exclude adapters of plugins skipped during initialize', async () => {
      pluginRegistry.register({
        key: 'plugin.skipped',
        label: 'plugin.skipped',
        version: '1.0.0',
        adapters: [createAdapter('skipped')],
        onRegister: () => {
          throw new Error('missing configuration');
        },
      });
      registerPluginWithAdapters('plugin.kept', [createAdapter('kept')]);
      await pluginRegistry.initialize({} as any);

      const keys = pluginRegistry.getAdapters(adapterType).map((adapter) => adapter.key);
      assert.deepStrictEqual(keys, ['kept']);
    });
  });
});
