import { BaseDiscountAdapter } from './BaseDiscountAdapter.js';

describe('BaseDiscountAdapter instantiation', () => {
  const adapter = BaseDiscountAdapter;
  const context = null as any;
  it('should initialize with default values', async () => {
    expect(adapter.orderIndex).toEqual(0);
    expect(adapter.log).toEqual(expect.any(Function));
    expect(await adapter.isManualAdditionAllowed('')).toEqual(false);
    expect(await adapter.isManualRemovalAllowed()).toEqual(false);
    expect(await adapter.actions(context)).toEqual({
      isValidForSystemTriggering: expect.any(Function),
      reserve: expect.any(Function),
      release: expect.any(Function),
      isValidForCodeTriggering: expect.any(Function),
      discountForPricingAdapterKey: expect.any(Function),
    });
  });

  describe('actions', () => {
    it('isValidForSystemTriggering', async () => {
      const result = await adapter.actions(context);
      expect(await result.isValidForSystemTriggering()).toEqual(false);
    });

    it('reserve', async () => {
      const result = await adapter.actions(context);
      expect(await result.reserve({ code: '' })).toEqual({});
    });

    it('release', async () => {
      const result = await adapter.actions(context);
      expect(await result.release()).toEqual(null);
    });

    it('isValidForCodeTriggering', async () => {
      const result = await adapter.actions(context);
      expect(await result.isValidForCodeTriggering({ code: '' })).toEqual(false);
    });

    it('discountForPricingAdapterKey', async () => {
      const result = await adapter.actions(context);
      const calculationSheet = {};
      expect(
        await result.discountForPricingAdapterKey({ calculationSheet, pricingAdapterKey: 'key' } as any),
      ).toEqual(null);
    });
  });
});
