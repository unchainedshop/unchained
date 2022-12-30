import { PaymentProviderType } from "../src/director/PaymentProviderType.js";
import { buildFindSelector } from "../src/module/configurePaymentProvidersModule.js";


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
