export interface PriceType {
  isTaxable?: boolean;
  isNetPrice?: boolean;
  countryCode?: string;
  currencyCode?: string;
  currency?: string;
  amount: number;
}

export const Price = {
  isTaxable({ isTaxable }: PriceType) {
    return isTaxable || false;
  },
  isNetPrice({ isNetPrice }: PriceType) {
    return isNetPrice || false;
  },
  currencyCode(obj: PriceType) {
    return obj?.currencyCode;
  },
  amount(obj: PriceType) {
    if (obj.amount) {
      /* 
      Why toFixed(0) Is Actually Reliable
      For integer rounding specifically:

      Half-values are exact: Numbers like 0.5, 1.5, 2.5 can be represented exactly in binary floating-point (they're powers of 2), so they round correctly.
      Floating-point errors are tiny: Even with calculation errors, they're usually on the order of 0.0000000001, which won't affect rounding to the nearest integer.
      Integer boundaries are far apart: Unlike toFixed(2) where the difference between 1.004 and 1.005 matters, for toFixed(0) you need errors approaching 0.5 to cause problems.

      Theoretical Edge Cases
      The only cases where toFixed(0) might fail would be:
      javascript// Extremely contrived calculation that should equal exactly 0.5
      // but might be 0.49999999999999994 (would round to 0 instead of 1)

      // Very large numbers where precision is lost entirely
      (9007199254740992.5).toFixed(0)  // Might have issues past MAX_SAFE_INTEGER

      // But in practice, these are incredibly rare
      */
      return Math.round(obj.amount).toFixed(0);
    }
    return 0;
  },
};
