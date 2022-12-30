import { DeliveryProviderType } from "../lib/director/DeliveryProviderType.js";
import { buildFindSelector } from "../lib/module/configureDeliveryModule.js";

describe('Delivery', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', async () => {      
      expect(buildFindSelector({})).toEqual({ deleted: null })
    });

    it('Return correct filter object when passed no argument', async () => {      
      expect(buildFindSelector({type: DeliveryProviderType.PICKUP})).toEqual({ type: 'PICKUP', deleted: null })
    });
  })
  
});
