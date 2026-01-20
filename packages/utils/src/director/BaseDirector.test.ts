import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BaseDirector } from './BaseDirector.ts';
import type { IBaseAdapter } from './BaseAdapter.ts';

describe('BaseDirector', () => {
  describe('getAdapter', () => {
    it('should return null for non-existent adapter', () => {
      const director = BaseDirector<IBaseAdapter>('TestDirector');
      const result = director.getAdapter('non-existent');
      assert.strictEqual(result, null);
    });
  });

  describe('getAdapters', () => {
    it('should return empty array when no adapters registered', () => {
      const director = BaseDirector<IBaseAdapter>('TestDirector');
      const result = director.getAdapters();
      assert.deepStrictEqual(result, []);
    });

    it('should filter adapters when adapterFilter provided', () => {
      const director = BaseDirector<IBaseAdapter>('TestDirector');
      const result = director.getAdapters({
        adapterFilter: (adapter) => adapter.key === 'test',
      });
      assert.deepStrictEqual(result, []);
    });
  });

  describe('with custom options', () => {
    it('should use custom adapterKeyField', () => {
      const director = BaseDirector<IBaseAdapter>('TestDirector', {
        adapterKeyField: 'label',
      });
      const result = director.getAdapter('test');
      assert.strictEqual(result, null);
    });

    it('should use custom adapterSortKey', () => {
      const director = BaseDirector<IBaseAdapter>('TestDirector', {
        adapterSortKey: 'orderIndex',
      });
      const result = director.getAdapters();
      assert.deepStrictEqual(result, []);
    });
  });
});
