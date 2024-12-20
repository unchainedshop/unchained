import accounting from 'accounting';

type PriceType = {
  isTaxable?: boolean;
  isNetPrice?: boolean;
  countryCode?: string;
  currencyCode?: string;
  currency?: string;
  amount: number;
};

export const Price = {
  isTaxable({ isTaxable }: PriceType) {
    return isTaxable || false;
  },
  isNetPrice({ isNetPrice }: PriceType) {
    return isNetPrice || false;
  },
  currency(obj: PriceType) {
    return obj?.currencyCode || obj?.currency;
  },
  amount(obj: PriceType) {
    if (obj.amount) {
      return accounting.toFixed(obj.amount, 0);
    }
    return 0;
  },
};
