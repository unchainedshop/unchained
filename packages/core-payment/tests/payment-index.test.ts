import { PaymentProviderType } from "../lib/director/PaymentProviderType.js";
import { buildFindSelector } from "../lib/module/configurePaymentProvidersModule.js";


describe('Payment', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', async () => {      
      expect(buildFindSelector({})).toEqual({ deleted: null })
    });

    it('Return correct filter object when passed no argument', async () => {      
      expect(buildFindSelector({type: PaymentProviderType.GENERIC})).toEqual({ type: "GENERIC", deleted: null })
    });
  })
  
});
