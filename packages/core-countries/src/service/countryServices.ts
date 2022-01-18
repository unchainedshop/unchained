import { CountryServices } from '@unchainedshop/types/countries';
import { resolveDefaultCurrencyCodeService } from './resolveDefaultCurrencyCodeService';

export const countryServices: CountryServices = {
  resolveDefaultCurrencyCode: resolveDefaultCurrencyCodeService,
};
