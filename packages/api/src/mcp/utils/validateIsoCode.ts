import type { LocalizationType } from '../tools/localization/types.ts';

const validateIsoCode = (localizationType: LocalizationType, isoCode: string): string => {
  switch (localizationType) {
    case 'COUNTRY':
      if (isoCode.length !== 2) {
        throw new Error('Country ISO code must be exactly 2 characters (ISO 3166-1 alpha-2)');
      }
      return isoCode.toUpperCase();
    case 'CURRENCY':
      if (isoCode.length !== 3) {
        throw new Error('Currency ISO code must be exactly 3 characters (ISO 4217)');
      }
      return isoCode.toUpperCase();
    case 'LANGUAGE':
      if (isoCode.length < 2 || isoCode.length > 10) {
        throw new Error('Language ISO code must be 2-10 characters (ISO 639-1/ISO 3166-1)');
      }
      return isoCode;
    default:
      return isoCode;
  }
};

export default validateIsoCode;
