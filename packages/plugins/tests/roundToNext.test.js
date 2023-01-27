import { roundToNext} from '../src/pricing/product-price-round'

describe('roundToNext', () => {
  it('rounds to the next multiple of precision correctly when the value is positive', () => {
    expect(roundToNext(5, 2)).toBe(6);
    expect(roundToNext(10, 5)).toBe(10);
    expect(roundToNext(13, 5)).toBe(15);
  });

  it('rounds to the next multiple of precision correctly when the value is negative', () => {
    expect(roundToNext(-5, 2)).toBe(-4);
    expect(roundToNext(-10, 5)).toBe(-10);
    expect(roundToNext(-13, 5)).toBe(-10);
  });

  it('returns 0 when the value is 0', () => {
    expect(roundToNext(0, 5)).toBe(0);
  });

  it('returns the same value when the precision is 1', () => {
    expect(roundToNext(5, 1)).toBe(5);
  });

});
