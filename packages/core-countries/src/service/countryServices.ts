import { CountryServices } from '@unchainedshop/types/countries';
import { resolveDefaultCurrencyCodeService } from "./resolveDefaultCurrencyCodeService.js";

export const countryServices: CountryServices = {
  resolveDefaultCurrencyCode: resolveDefaultCurrencyCodeService,
};
