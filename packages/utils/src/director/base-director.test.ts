import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { BaseDirector } from './BaseDirector.js';

const adapter1 = {
  key: 'adapter1',
  label: 'Adapter 1',
  version: '1',
  log: () => ({}),
};

const adapter2 = {
  key: 'adapter2',
  label: 'Adapter 2',
  version: '2',
  log: () => ({}),
};

const adapter3 = {
  key: 'adapter3',
  label: 'Adapter 3',
  version: '3',
  log: () => ({}),
};

describe('BaseDirector', () => {
  let director;

  beforeEach(() => {
    director = BaseDirector('TestDirector');
    director.registerAdapter(adapter1);
    director.registerAdapter(adapter3);
    director.registerAdapter(adapter2);
  });

  describe('registerAdapter', () => {
    it('should add the adapter to the director', () => {
      director.registerAdapter(adapter1);
      assert.strictEqual(director.getAdapter(adapter1.key), adapter1);
    });

    it('should allow multiple adapters to be registered', () => {
      assert.strictEqual(director.getAdapter(adapter1.key), adapter1);
      assert.strictEqual(director.getAdapter(adapter2.key), adapter2);
    });

    it('should register an adapter and add it to the internal map', () => {
      assert.deepStrictEqual(director.getAdapter(adapter1.key), adapter1);
    });

    it('should use the adapterKeyField specified in the options to store the adapter in the internal map', () => {
      director = BaseDirector('TestDirector', {
        adapterKeyField: 'label',
      });
      director.registerAdapter(adapter1);
      assert.deepStrictEqual(director.getAdapter(adapter1.label), adapter1);
    });

    it('should return the correct Adapter object', () => {
      const directorName = 'TestDirector';
      const adapterKeyField = 'key';
      director = BaseDirector(directorName, { adapterKeyField });
      director.registerAdapter(adapter1);

      assert.deepStrictEqual(director.getAdapter(adapter1.key), adapter1);
    });

    it('should return undefined if the Adapter does not exist', () => {
      const directorName = 'TestDirector';
      const adapterKeyField = 'key';
      director = BaseDirector(directorName, { adapterKeyField });
      assert.strictEqual(director.getAdapter(adapter1.key), undefined);
    });
  });

  describe('getAdapter', () => {
    it('should return the correct Adapter object for a given key', () => {
      assert.strictEqual(director.getAdapter(adapter1.key), adapter1);
    });

    it('should return undefined if no Adapter is registered with the given key', () => {
      assert.strictEqual(director.getAdapter('invalid-key'), undefined);
    });

    it('should return the correct Adapter object when the keyField is set to a property other than "key"', () => {
      director = BaseDirector('TestDirector', { adapterKeyField: 'label' });
      director.registerAdapter(adapter1);
      assert.strictEqual(director.getAdapter(adapter1.label), adapter1);
    });
  });

  describe('getAdapters', () => {
    it('should return an array of registered Adapter objects', () => {
      assert.deepStrictEqual(director.getAdapters(), [adapter1, adapter3, adapter2]);
    });

    it('should return an empty array if no Adapter objects have been registered', () => {
      const directorName = 'TestDirector';
      const adapterKeyField = 'key';
      const baseDirector = BaseDirector(directorName, { adapterKeyField });
      assert.deepStrictEqual(baseDirector.getAdapters(), []);
    });

    it('should return an array of registered Adapter objects sorted by the adapterSortKey provided', () => {
      director = BaseDirector('TestDirector', { adapterSortKey: 'version' });
      director.registerAdapter(adapter1);
      director.registerAdapter(adapter3);
      director.registerAdapter(adapter2);
      assert.deepStrictEqual(director.getAdapters(), [adapter1, adapter2, adapter3]);
    });
  });
});
