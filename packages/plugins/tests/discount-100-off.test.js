import { HundredOff } from '../src/pricing/discount-100-off';

describe('HundredOff', () => {
  it('isManualAdditionAllowed', async () => {
  expect(await HundredOff.isManualAdditionAllowed()).toBeTruthy();
  });
  it('isManualRemovalAllowed', async () => {
  expect(await HundredOff.isManualRemovalAllowed()).toBeTruthy();
  });
  it('isValidForSystemTriggering', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context });
    expect(await actions.isValidForSystemTriggering()).toBeFalsy();
    });
  it('isValidForCodeTriggering', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context });
    expect(await actions.isValidForCodeTriggering({ code: '100OFF' })).toBeTruthy();
    expect(await actions.isValidForCodeTriggering({ code: 'wrongcode' })).toBeFalsy();
  });

  it('discountForPricingAdapterKey', async () => {
    const context = {};
    const actions = await HundredOff.actions({ context });
    expect(
    actions.discountForPricingAdapterKey({ pricingAdapterKey: 'shop.unchained.pricing.order-discount' })
    ).toEqual({ fixedRate: 10000 });
    expect(actions.discountForPricingAdapterKey({ pricingAdapterKey: 'shop.unchained.pricing.other-discount' })).toBeNull();
    });
});
