import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureQuotationsModule.ts';

describe('Quotation', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', () => {
      assert.deepStrictEqual(buildFindSelector({}), {});
    });

    it('Return correct filter object when passed queryString and userId', () => {
      assert.deepStrictEqual(buildFindSelector({ queryString: 'hello world', userId: 'admin-id' }), {
        userId: 'admin-id',
        $text: { $search: 'hello world' },
      });
    });

    it('Return correct filter object when passed userId', () => {
      assert.deepStrictEqual(buildFindSelector({ userId: 'admin-id' }), { userId: 'admin-id' });
    });
    it('Return correct filter object when passed queryString', () => {
      assert.deepStrictEqual(buildFindSelector({ queryString: 'hello world' }), {
        $text: { $search: 'hello world' },
      });
    });
  });
});
