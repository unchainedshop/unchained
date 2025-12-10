import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PaymentProviderType } from '../db/PaymentProvidersCollection.ts';
import { buildFindSelector } from './configurePaymentProvidersModule.ts';

describe('Payment', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', () => {
      assert.deepStrictEqual(buildFindSelector({}), { deleted: null });
    });

    it('Return correct filter object when passed type argument', () => {
      assert.deepStrictEqual(buildFindSelector({ type: PaymentProviderType.GENERIC }), {
        type: 'GENERIC',
        deleted: null,
      });
    });
  });
});
