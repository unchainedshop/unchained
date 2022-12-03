import { WarehousingProviderType } from "../src/director/WarehousingProviderType";
import { buildFindSelector } from "../src/module/configureWarehousingModule";

describe('Warehousing', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', async () => {      
      expect(buildFindSelector({})).toEqual({ deleted: null })
    });

    it('Return correct filter object when passed no argument', async () => {      
      expect(buildFindSelector({type: WarehousingProviderType.PHYSICAL})).toEqual({ type: "PHYSICAL", deleted: null })
    });
  })
  
});
