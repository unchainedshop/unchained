import { WarehousingProviderType } from "../lib/director/WarehousingProviderType.js";
import { buildFindSelector } from "../lib/module/configureWarehousingModule.js";

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
