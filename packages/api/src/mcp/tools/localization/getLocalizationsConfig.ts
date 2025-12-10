import type { Context } from 'vm';
import { CountryNotFoundError, CurrencyNotFoundError, LanguageNotFoundError } from '../../../errors.ts';
import type { LocalizationType, LocalizationModuleConfig } from './types.ts';

export const getLocalizationsConfig = (
  context: Context,
  localizationType: LocalizationType,
): LocalizationModuleConfig => {
  const { modules } = context;

  switch (localizationType) {
    case 'COUNTRY':
      return {
        module: modules.countries,
        NotFoundError: CountryNotFoundError,
        entityName: 'country',
        idField: 'countryId',
        existsMethod: modules.countries.countryExists,
        findMethod: modules.countries.findCountry,
        findMultipleMethod: modules.countries.findCountries,
      };
    case 'CURRENCY':
      return {
        module: modules.currencies,
        NotFoundError: CurrencyNotFoundError,
        entityName: 'currency',
        idField: 'currencyId',
        existsMethod: modules.currencies.currencyExists,
        findMethod: modules.currencies.findCurrency,
        findMultipleMethod: modules.currencies.findCurrencies,
      };
    case 'LANGUAGE':
      return {
        module: modules.languages,
        NotFoundError: LanguageNotFoundError,
        entityName: 'language',
        idField: 'languageId',
        existsMethod: modules.languages.languageExists,
        findMethod: modules.languages.findLanguage,
        findMultipleMethod: modules.languages.findLanguages,
      };
    default:
      throw new Error(`Unknown localization type: ${localizationType}`);
  }
};
