import accounting from 'accounting';

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
      return accounting.toFixed(obj.amount, 0);
    }
    return 0;
  },
};
