import { CountryServices } from '@unchainedshop/types/countries.js';
import { resolveDefaultCurrencyCodeService } from './resolveDefaultCurrencyCodeService.js';

export const countryServices: CountryServices = {
  resolveDefaultCurrencyCode: resolveDefaultCurrencyCodeService,
};
