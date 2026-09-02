import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Product } from '@unchainedshop/core-products';
import euTaxRates from './eu-tax-rates.json' with { type: 'json' };
import { compileEraRates, rateForDate } from './eraRates.ts';

// Per-country VAT rate tables for all 27 EU member states, bundled in
// eu-tax-rates.json and verified against the European Commission's data (see
// the json's `source`/`verifiedAt` fields). Update via the `update-tax-rates`
// skill — never at runtime: VAT rates are legally binding and must be
// reviewable/versioned, and the applicable rate follows the supply date, so
// the full era history is required.
//
// Category names are the EU VAT Directive's: `standard` (every country),
// `reduced` / `reduced2` / `super_reduced` / `parking` (where a country has
// them). Products select a category via a `eu-tax-category:<name>` tag,
// delivery providers via a `eu-tax-category` configuration entry; requesting
// a category a country doesn't have falls back to its standard rate — never
// silently to zero.

export const EU_TAX_CATEGORY_TAG_PREFIX = 'eu-tax-category:';
const PROVIDER_CONFIGURATION_KEY = 'eu-tax-category';

const countryRates: Record<
  string,
  Record<string, (referenceDate?: Date) => number>
> = Object.fromEntries(
  Object.entries(euTaxRates.countries).map(([countryCode, categories]) => [
    countryCode,
    Object.fromEntries(
      Object.entries(categories).map(([category, eras]) => [
        category,
        rateForDate(
          compileEraRates(eras, euTaxRates.timezones[countryCode as keyof typeof euTaxRates.timezones]),
        ),
      ]),
    ),
  ]),
);

// the table is keyed by ISO 3166-1 codes; the EU institutions use EL for
// Greece, addresses use GR — accept both
const normalizeCountryCode = (countryCode?: string | null): string | null => {
  const normalized = countryCode?.toUpperCase().trim() || null;
  return normalized === 'EL' ? 'GR' : normalized;
};

export const EU_MEMBER_COUNTRY_CODES: string[] = Object.keys(countryRates);

export const isEuMemberCountry = (countryCode?: string | null): boolean => {
  const normalized = normalizeCountryCode(countryCode);
  return Boolean(normalized && countryRates[normalized]);
};

export const resolveEuTaxRate = ({
  countryCode,
  category,
  referenceDate,
}: {
  countryCode?: string | null;
  category?: string | null;
  referenceDate?: Date;
}): number | null => {
  const normalized = normalizeCountryCode(countryCode);
  const categories = normalized ? countryRates[normalized] : null;
  if (!categories) return null;
  const resolveRate = (category && categories[category]) || categories.standard;
  return resolveRate(referenceDate);
};

export const resolveEuTaxCategoryFromProduct = (product: Product): string | null => {
  const categoryTag = product?.tags?.find((tag) =>
    tag?.trim().toLowerCase().startsWith(EU_TAX_CATEGORY_TAG_PREFIX),
  );
  if (!categoryTag) return null;
  return categoryTag.trim().toLowerCase().slice(EU_TAX_CATEGORY_TAG_PREFIX.length) || null;
};

export const resolveEuTaxCategoryFromDeliveryProvider = (provider: DeliveryProvider): string | null => {
  const value = provider?.configuration?.find(({ key }) => key === PROVIDER_CONFIGURATION_KEY)?.value;
  return value?.trim().toLowerCase() || null;
};
