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
      return Number(obj.amount).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: false,
      });
    }
    return 0;
  },
};
