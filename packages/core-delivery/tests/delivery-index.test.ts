import { DeliveryProviderType } from "../src/director/DeliveryProviderType";
import { buildFindSelector } from "../src/module/configureDeliveryModule";

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
