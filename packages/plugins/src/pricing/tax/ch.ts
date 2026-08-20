import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Product } from '@unchainedshop/core-products';
import swissTaxRates from './ch-tax-rates.json' with { type: 'json' };
import { compileEraRates, rateForDate } from './eraRates.ts';

// Rates are bundled in ch-tax-rates.json and verified against the ESTV
// (see the json's `source`/`verifiedAt` fields). Update via the
// `update-tax-rates` skill — never at runtime: VAT rates are legally
// binding and must be reviewable/versioned, and the applicable rate follows
// the supply date, so the full era history is required.

export interface SwissTaxCategoryResolver {
  value: string;
  rate: (referenceDate?: Date) => number;
}

export const SwissTaxCategories: Record<string, SwissTaxCategoryResolver> = Object.fromEntries(
  Object.entries(swissTaxRates.categories).map(([value, eras]) => [
    value.toUpperCase(),
    { value, rate: rateForDate(compileEraRates(eras, swissTaxRates.timezone)) },
  ]),
);

export const resolveTaxCategoryFromDeliveryProvider = (
  provider: DeliveryProvider,
): SwissTaxCategoryResolver | null => {
  const taxCategoryFromProvider = provider?.configuration
    ?.find(({ key }) => {
      if (key === 'swiss-tax-category') return true;
      return null;
    })
    ?.value?.toUpperCase();

  const taxCategory = taxCategoryFromProvider ? SwissTaxCategories[taxCategoryFromProvider] : null;
  return taxCategory;
};

export const resolveTaxCategoryFromProduct = (product: Product): SwissTaxCategoryResolver | null => {
  const productSpecialTaxTag = product.tags?.find((tag) =>
    tag?.trim().toLowerCase().startsWith('swiss-tax-category:'),
  );
  const taxCategory = Object.values(SwissTaxCategories).find(
    (t) => `swiss-tax-category:${t.value}` === productSpecialTaxTag?.trim().toLowerCase(),
  );
  return taxCategory || null;
};
