import { PaymentProviderType } from '../payment-index.js';
import { buildFindSelector } from './configurePaymentProvidersModule.js';

describe('Payment', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', () => {
      expect(buildFindSelector({})).toEqual({ deleted: null });
    });

    it('Return correct filter object when passed no argument', () => {
      expect(buildFindSelector({ type: PaymentProviderType.GENERIC })).toEqual({
        type: 'GENERIC',
        deleted: null,
      });
    });
  });
});
