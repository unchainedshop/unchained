import isLength from 'validator/lib/isLength';
import isEmail from 'validator/lib/isEmail';
import { isAfter, isValid as isValidDate, startOfDay } from 'date-fns';

import { MessageDescriptor, useIntl } from 'react-intl';
import { PrimitiveType } from 'intl-messageformat';
import { CountryCodes, LanguageCodes } from '../../common/data/iso-codes';

const DATE_FORMAT = 'd.M.y';

export type Validator = {
  isValid: (arg0: any) => boolean;
  intlMessageDescriptor: MessageDescriptor;
  intlMessageValues?: Record<string, PrimitiveType>;
};

const isString = (value) => typeof value === 'string';

export const validateMaxLength = (max: number): Validator => ({
  isValid: (value) => isLength(value || '', { max }),
  intlMessageDescriptor: { id: 'error_max_length' },
  intlMessageValues: { maxLength: max.toString() },
});

export const validateEmail: Validator = {
  isValid: (value) => isEmail(value || ''),
  intlMessageDescriptor: {
    id: 'error_email',
    defaultMessage: '{label} must be a valid email address',
  },
};

export const validateLanguage = (): Validator => ({
  isValid: (value) => LanguageCodes.includes(value?.toLowerCase()),
  intlMessageDescriptor: {
    id: 'error_language_code',
    defaultMessage: 'Invalid language code',
  },
});

export const isContractAddress = (isRequired = false): Validator => ({
  isValid: (value) =>
    !isRequired && !value ? true : /^(0x)?[a-z0-9]{40}$/i.test(value),

  intlMessageDescriptor: {
    id: 'error_contract_address',
    defaultMessage: 'Invalid contract address',
  },
});

export const validateInteger = (): Validator => ({
  isValid: (value) => !Number.isNaN(value) && Number.isInteger(value),
  intlMessageDescriptor: {
    id: 'error_number_not_int',
    defaultMessage: 'Invalid value please provide integer value',
  },
});

export const validateCountry = (): Validator => ({
  isValid: (value) => CountryCodes.includes(value.toUpperCase()),
  intlMessageDescriptor: {
    id: 'error_country_code',
    defaultMessage: 'Invalid country code',
  },
});

export const validateRequired: Validator = {
  isValid: (value) => {
    if (isString(value)) {
      return value.trim().length > 0;
    }
    if (typeof value === 'number') {
      return true;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return !!value;
  },
  intlMessageDescriptor: {
    id: 'error_required',
    defaultMessage: '{label} is a required field',
  },
};

export const validateDate: Validator = {
  isValid: (value) => (value ? isValidDate(new Date(value)) : true),
  intlMessageDescriptor: {
    id: 'error_invalid_date',
    defaultMessage: '{label} is not a valid date',
  },
};

export const validateBirthdate: Validator = {
  isValid: (value) => {
    if (!value) return true;

    const date = new Date(value);
    if (!isValidDate(date)) return false;
    const today = startOfDay(new Date());
    return !isAfter(date, today);
  },
  intlMessageDescriptor: {
    id: 'error_birthdate_in_future',
    defaultMessage: '{label} cannot be in the future',
  },
};

export const validateRequiredTag = (isRequired): Validator => ({
  isValid: (value) => (isRequired ? value.length > 0 : true),
  intlMessageDescriptor: {
    id: 'error_tag_required',
    defaultMessage: '{label} you must provide at least one tag',
  },
});

export const validateProductCommerce = (currentIndex, values): Validator => {
  return {
    isValid: () => {
      if (!values?.length || values?.length === 1) return true;
      const current = values[currentIndex];
      const others = values.filter((_, index) => index !== currentIndex);

      const isSame = others.every(
        ({ maxQuantity, countryCode, currencyCode }) => {
          return (
            maxQuantity !== current?.maxQuantity ||
            countryCode !== current?.countryCode ||
            currencyCode !== current?.currencyCode
          );
        },
      );
      return isSame;
    },

    intlMessageDescriptor: {
      id: 'error_same_product_prices',
      defaultMessage:
        '{label} can not be equal for a price with the same country and currency',
    },
  };
};

const isEmpty = (value) =>
  value === null || value === '' || value === undefined;

export const validateProductCommerceOneNull = (values): Validator => {
  return {
    isValid: () => {
      if (
        values?.length &&
        values?.length === 1 &&
        !isEmpty(values[0].maxQuantity)
      )
        return false;
      if (
        values.filter(({ maxQuantity }) => isEmpty(maxQuantity))?.length !== 1
      )
        return false;
      return true;
    },

    intlMessageDescriptor: {
      id: 'error_commerce_quantity_null_required',
      defaultMessage:
        '{label} should have one price with null /empty max quantity',
    },
  };
};

const useInitializeDefaultErrorMessages = () => {
  const { formatMessage } = useIntl();

  formatMessage({
    id: 'error_email',
    defaultMessage: '{label} must be a valid email address',
  });
  formatMessage({
    id: 'error_language_code',
    defaultMessage: 'Invalid language code',
  });
  formatMessage({
    id: 'error_currency_code',
    defaultMessage: 'Invalid currency code',
  });
  formatMessage({
    id: 'error_contract_address',
    defaultMessage: 'Invalid contract address',
  });
  formatMessage({
    id: 'error_number_not_int',
    defaultMessage: 'Invalid value please provide integer value',
  });
  formatMessage({
    id: 'error_country_code',
    defaultMessage: 'Invalid country code',
  });
  formatMessage({
    id: 'error_required',
    defaultMessage: '{label} is a required field',
  });
  formatMessage({
    id: 'error_invalid_date',
    defaultMessage: '{label} is not a valid date',
  });
  formatMessage({
    id: 'error_date_before',
    defaultMessage: '{label} must be before {dateToCompare}.',
  });
  formatMessage({
    id: 'error_tag_required',
    defaultMessage: '{label} you must provide at least one tag',
  });

  formatMessage({
    id: 'error_date_after',
    defaultMessage: '{label} must be after {dateToCompare}.',
  });
  formatMessage({
    id: 'error_text_area_required',
    defaultMessage: '{label} is required',
  });
  formatMessage({
    id: 'error_phone_number_invalid',
    defaultMessage: 'Invalid phone number',
  });
  formatMessage({
    id: 'error_same_product_prices',
    defaultMessage:
      '{label} can not be equal for a price with the same country and currency',
  });

  formatMessage({
    id: 'error_date_after',
    defaultMessage: '{label} must be after {dateToCompare}.',
  });
  formatMessage({
    id: 'error_commerce_quantity_null_required',
    defaultMessage:
      '{label} should have one price with null /empty max quantity',
  });
};
