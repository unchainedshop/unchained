import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

// Normalizes a free-form phone number to the E.164 format (e.g. "+41791234567").
// `defaultCountry` is an ISO 3166-1 alpha-2 code (matching Address.countryCode) used
// to resolve numbers that are written in national format (without a country code).
// Returns undefined when the input is empty or cannot be parsed into a valid number.
export const normalizePhoneNumber = (
  value?: string | null,
  defaultCountry?: string | null,
): string | undefined => {
  if (!value) return undefined;
  const parsed = parsePhoneNumberFromString(value, (defaultCountry || undefined) as CountryCode);
  if (!parsed?.isValid()) return undefined;
  return parsed.number;
};

// Splits a phone number into its country calling code and subscriber number, as
// required by Datatrans 3DS cardholder data (e.g. { cc: "41", subscriber: "791234567" }).
// Returns undefined when the input is empty or cannot be parsed into a valid number.
export const phoneNumberToParts = (
  value?: string | null,
  defaultCountry?: string | null,
): { cc: string; subscriber: string } | undefined => {
  if (!value) return undefined;
  const parsed = parsePhoneNumberFromString(value, (defaultCountry || undefined) as CountryCode);
  if (!parsed?.isValid()) return undefined;
  return { cc: parsed.countryCallingCode, subscriber: parsed.nationalNumber };
};
