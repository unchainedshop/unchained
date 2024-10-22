import { BaseDirector } from './BaseDirector.js';

const adapter1 = {
  key: 'adapter1',
  label: 'Adapter 1',
  version: '1',
  log: import.meta.jest.fn(),
};

const adapter2 = {
  key: 'adapter2',
  label: 'Adapter 2',
  version: '2',
  log: import.meta.jest.fn(),
};

const adapter3 = {
  key: 'adapter3',
  label: 'Adapter 3',
  version: '3',
  log: import.meta.jest.fn(),
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
      expect(director.getAdapter(adapter1.key)).toBe(adapter1);
    });

    xit('should generate a log message when an adapter is registered', () => {
      const spy = import.meta.jest.spyOn(console, 'log');
      expect(spy).toHaveBeenCalledWith('TestDirector -> Registered  adapter1 1.0.0 (Adapter 1)');
    });

    it('should allow multiple adapters to be registered', () => {
      expect(director.getAdapter(adapter1.key)).toBe(adapter1);
      expect(director.getAdapter(adapter2.key)).toBe(adapter2);
    });

    it('should register an adapter and add it to the internal map', () => {
      expect(director.getAdapter(adapter1.key)).toEqual(adapter1);
    });

    it('should use the adapterKeyField specified in the options to store the adapter in the internal map', () => {
      director = BaseDirector('TestDirector', {
        adapterKeyField: 'label',
      });
      director.registerAdapter(adapter1);
      expect(director.getAdapter(adapter1.label)).toEqual(adapter1);
    });

    it('should return the correct Adapter object', () => {
      const directorName = 'TestDirector';
      const adapterKeyField = 'key';
      director = BaseDirector(directorName, { adapterKeyField });
      director.registerAdapter(adapter1);

      expect(director.getAdapter(adapter1.key)).toEqual(adapter1);
    });

    it('should return undefined if the Adapter does not exist', () => {
      const directorName = 'TestDirector';
      const adapterKeyField = 'key';
      director = BaseDirector(directorName, { adapterKeyField });
      expect(director.getAdapter(adapter1.key)).toBeUndefined();
    });
  });

  describe('getAdapter', () => {
    it('should return the correct Adapter object for a given key', () => {
      // Expect that calling getAdapter with the key 'foo' returns the fooAdapter
      expect(director.getAdapter(adapter1.key)).toBe(adapter1);
    });

    it('should return undefined if no Adapter is registered with the given key', () => {
      // Expect that calling getAdapter with a key that has not been registered returns undefined
      expect(director.getAdapter('invalid-key')).toBeUndefined();
    });

    it('should return the correct Adapter object when the keyField is set to a property other than "key"', () => {
      // Create a director with the keyField option set to 'label'
      director = BaseDirector('TestDirector', { adapterKeyField: 'label' });
      director.registerAdapter(adapter1);
      expect(director.getAdapter(adapter1.label)).toBe(adapter1);
    });
  });

  describe('getAdapters', () => {
    it('should return an array of registered Adapter objects', () => {
      expect(director.getAdapters()).toEqual([adapter1, adapter3, adapter2]);
    });

    it('should return an empty array if no Adapter objects have been registered', () => {
      const directorName = 'TestDirector';
      const adapterKeyField = 'key';
      const baseDirector = BaseDirector(directorName, { adapterKeyField });
      expect(baseDirector.getAdapters()).toEqual([]);
    });

    it('should return an array of registered Adapter objects sorted by the adapterSortKey provided', () => {
      director = BaseDirector('TestDirector', { adapterSortKey: 'version' });
      director.registerAdapter(adapter1);
      director.registerAdapter(adapter3);
      director.registerAdapter(adapter2);
      expect(director.getAdapters()).toEqual([adapter1, adapter2, adapter3]);
    });
  });
});
