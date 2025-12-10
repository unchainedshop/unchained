import type { DeliveryProvider } from '@unchainedshop/core-delivery';
import type { Product } from '@unchainedshop/core-products';

const startOf2024 = new Date('2024-01-01T00:00:00.000+0100');

// https://www.estv.admin.ch/estv/en/home/value-added-tax/vat-rates-switzerland.html

export interface SwissTaxCategoryResolver {
  value: string;
  rate: (referenceDate?: Date) => number;
}

export const SwissTaxCategories: Record<string, SwissTaxCategoryResolver> = {
  DEFAULT: {
    value: 'default',
    rate: (referenceDate = new Date()) => {
      if (referenceDate.getTime() < startOf2024.getTime()) {
        return 0.077;
      }
      return 0.081;
    },
  },
  REDUCED: {
    value: 'reduced',
    rate: (referenceDate = new Date()) => {
      if (referenceDate.getTime() < startOf2024.getTime()) {
        return 0.025;
      }
      return 0.026;
    },
  },
  SPECIAL: {
    value: 'special',
    rate: (referenceDate = new Date()) => {
      if (referenceDate.getTime() < startOf2024.getTime()) {
        return 0.037;
      }
      return 0.038;
    },
  },
};

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
