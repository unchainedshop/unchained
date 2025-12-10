import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DeliveryProviderType } from '../delivery-index.ts';
import { buildFindSelector } from './configureDeliveryModule.ts';

describe('Delivery', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', () => {
      assert.deepStrictEqual(buildFindSelector({}), { deleted: null });
    });

    it('Return correct filter object when passed type', () => {
      assert.deepStrictEqual(buildFindSelector({ type: DeliveryProviderType.PICKUP }), {
        type: 'PICKUP',
        deleted: null,
      });
    });
  });
});
