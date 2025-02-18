import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WarehousingProviderType } from '../db/WarehousingProvidersCollection.js';
import { buildFindSelector } from './configureWarehousingModule.js';

describe('Warehousing', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', () => {
      assert.deepStrictEqual(buildFindSelector({}), { deleted: null });
    });

    it('Return correct filter object when passed no argument', () => {
      assert.deepStrictEqual(buildFindSelector({ type: WarehousingProviderType.PHYSICAL }), {
        type: 'PHYSICAL',
        deleted: null,
      });
    });
  });
});
