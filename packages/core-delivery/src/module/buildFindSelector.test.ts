import { DeliveryProviderType } from '../delivery-index.js';
import { buildFindSelector } from './configureDeliveryModule.js';

describe('Delivery', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', () => {
      expect(buildFindSelector({})).toEqual({ deleted: null });
    });

    it('Return correct filter object when passed no argument', () => {
      expect(buildFindSelector({ type: DeliveryProviderType.PICKUP })).toEqual({
        type: 'PICKUP',
        deleted: null,
      });
    });
  });
});
