import {
  ProductPricingDirector,
  ProductPricingAdapter,
  ProductPricingAdapterContext,
  IProductPricingAdapter,
  ProductPricingRowCategory,
  UnchainedCore,
} from '@unchainedshop/core';
import { SwissTaxCategories } from './tax/ch.js';

export const getTaxRate = (context: ProductPricingAdapterContext) => {
  const { product, order } = context;

  const productSpecialTaxTag = product.tags?.find((tag) =>
    tag?.trim().toLowerCase().startsWith('swiss-tax-category:'),
  );
  const taxCategory =
    Object.values(SwissTaxCategories).find(
      (t) => `swiss-tax-category:${t.value}` === productSpecialTaxTag?.trim().toLowerCase(),
    ) || SwissTaxCategories.DEFAULT;

  return taxCategory.rate(order?.ordered);
};

export const isDeliveryAddressInSwitzerland = async ({
  order,
  countryCode: forceCountryCode,
  modules,
}: ProductPricingAdapterContext & { modules: UnchainedCore['modules'] }) => {
  let countryCode = forceCountryCode?.toUpperCase().trim() || order.countryCode;

  if (order) {
    const orderDelivery = await modules.orders.deliveries.findDelivery({
      orderDeliveryId: order.deliveryId,
    });
    const address = orderDelivery?.context?.address || order.billingAddress;

    if (address?.countryCode > '') {
      countryCode = address.countryCode?.toUpperCase().trim();
    }
  }

  return countryCode === 'CH' || countryCode === 'LI';
};

export const ProductSwissTax: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-swiss-tax',
  version: '1.0.0',
  label: 'Apply Swiss Tax on Product',
  orderIndex: 80,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);
    const { context } = params;

    return {
      ...pricingAdapter,

      calculate: async () => {
        if (!(await isDeliveryAddressInSwitzerland(context))) {
          return pricingAdapter.calculate();
        }
        const taxRate = getTaxRate(context);
        ProductPricingAdapter.log(`ProductSwissTax -> Tax Multiplicator: ${taxRate}`);
        params.calculationSheet.filterBy({ isTaxable: true }).forEach(({ isNetPrice, ...row }) => {
          if (!isNetPrice) {
            const taxAmount = row.amount - row.amount / (1 + taxRate);
            pricingAdapter.resultSheet().calculation.push({
              ...row,
              amount: -taxAmount,
              isTaxable: false,
              isNetPrice: false,
              meta: { adapter: ProductSwissTax.key },
            });
            pricingAdapter.resultSheet().addTax({
              amount: taxAmount,
              rate: taxRate,
              baseCategory: ProductPricingRowCategory.Item,
              meta: { adapter: ProductSwissTax.key },
            });
          } else {
            const taxAmount = row.amount * taxRate;
            pricingAdapter.resultSheet().addTax({
              amount: taxAmount,
              rate: taxRate,
              baseCategory: ProductPricingRowCategory.Item,
              meta: { adapter: ProductSwissTax.key },
            });
          }
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductSwissTax);
