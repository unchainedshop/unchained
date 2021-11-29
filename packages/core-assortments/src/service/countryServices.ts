import {
  resolveDefaultCurrencyCodeService,
  ResolveDefaultCurrencyCodeService,
} from './resolveDefaultCurrencyCodeService';

export interface CountryServices {
  resolveDefaultCurrencyCodeService: ResolveDefaultCurrencyCodeService;
}

export const countryServices: CountryServices = {
  resolveDefaultCurrencyCodeService,
};
