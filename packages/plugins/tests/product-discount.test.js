import {applyRate} from '../src/pricing/product-discount'
describe('applyRate', () => {
  it('applies the rate correctly when a rate is provided', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(10);
  });

  it('applies the fixed rate correctly when a fixed rate is provided', () => {
    const configuration = {
      fixedRate: 50
    };
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(50);
  });

  it('applies the fixed rate correctly when a fixed rate is provided and the amount is less than fixed rate', () => {
    const configuration = {
      fixedRate: 150
    };
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(100);
  });

  it('applies the rate correctly when rate is less than or equal to 0', () => {
    const configuration = {
      rate: -0.1
    };
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });
  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });


  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });


  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });



  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });


  it('returns 0 when rate and fixed rate are not provided', () => {
    const configuration = {};
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(0);
  });

  it('applies the rate correctly when only rate is provided and amount is negative', () => {
    const configuration = {
      rate: 0.1
    };
    const amount = -100;
    expect(applyRate(configuration, amount)).toBe(-10);
  });

  it('returns 0 when rate and fixed rate are not provided', () => {
    const configuration = {};
    const amount = 100;
    expect(applyRate(configuration, amount)).toBe(0);
  });


});
