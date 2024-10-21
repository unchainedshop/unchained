import { WarehousingProviderType } from '../warehousing-index.js';
import { buildFindSelector } from './configureWarehousingModule.js';

describe('Warehousing', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', () => {
      expect(buildFindSelector({})).toEqual({ deleted: null });
    });

    it('Return correct filter object when passed no argument', () => {
      expect(buildFindSelector({ type: WarehousingProviderType.PHYSICAL })).toEqual({
        type: 'PHYSICAL',
        deleted: null,
      });
    });
  });
});
