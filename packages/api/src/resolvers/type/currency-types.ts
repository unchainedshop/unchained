import { currencyDecimals } from '@unchainedshop/utils';

export const Currency = {
  decimals: (currency) => currencyDecimals(currency.decimals),
};
