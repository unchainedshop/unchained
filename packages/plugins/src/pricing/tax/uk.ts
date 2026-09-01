import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Product } from '@unchainedshop/core-products';
import ukTaxRates from './uk-tax-rates.json' with { type: 'json' };
import { compileEraRates, rateForDate } from './eraRates.ts';

// UK VAT rates, bundled in uk-tax-rates.json and verified against gov.uk
// (see the json's `source`/`verifiedAt` fields). Update via the
// `update-tax-rates` skill — never at runtime: VAT rates are legally binding
// and must be reviewable/versioned, and the applicable rate follows the
// supply date, so the full era history is required.
//
// The UK VAT area is Great Britain, Northern Ireland and the Isle of Man.
// Categories: standard, reduced (domestic fuel & power etc.), zero
// (most food, books, children's clothing). Products select a category via a
// `uk-tax-category:<name>` tag, delivery providers via a `uk-tax-category`
// configuration entry.

export const UK_VAT_COUNTRY_CODES = ['GB', 'IM'];

export interface UkTaxCategoryResolver {
  value: string;
  rate: (referenceDate?: Date) => number;
}

export const UkTaxCategories: Record<string, UkTaxCategoryResolver> = Object.fromEntries(
  Object.entries(ukTaxRates.categories).map(([value, eras]) => [
    value.toUpperCase(),
    { value, rate: rateForDate(compileEraRates(eras, ukTaxRates.timezone)) },
  ]),
);

export const resolveUkTaxCategoryFromDeliveryProvider = (
  provider: DeliveryProvider,
): UkTaxCategoryResolver | null => {
  const taxCategoryFromProvider = provider?.configuration
    ?.find(({ key }) => {
      if (key === 'uk-tax-category') return true;
      return null;
    })
    ?.value?.toUpperCase();

  const taxCategory = taxCategoryFromProvider ? UkTaxCategories[taxCategoryFromProvider] : null;
  return taxCategory;
};

export const resolveUkTaxCategoryFromProduct = (product: Product): UkTaxCategoryResolver | null => {
  const productSpecialTaxTag = product?.tags?.find((tag) =>
    tag?.trim().toLowerCase().startsWith('uk-tax-category:'),
  );
  const taxCategory = Object.values(UkTaxCategories).find(
    (t) => `uk-tax-category:${t.value}` === productSpecialTaxTag?.trim().toLowerCase(),
  );
  return taxCategory || null;
};
