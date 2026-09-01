import {
  ProductPricingAdapter,
  type IProductPricingAdapter,
  ProductPricingRowCategory,
} from '@unchainedshop/core';
import {
  resolveUkTaxCategoryFromDeliveryProvider,
  resolveUkTaxCategoryFromProduct,
  UkTaxCategories,
  UK_VAT_COUNTRY_CODES,
  type UkTaxCategoryResolver,
} from '../tax/uk.ts';
import isDeliveryAddressInCountry from '../utils/isDeliveryAddressInCountry.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const ProductUkTax: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-uk-tax',
  version: '1.0.0',
  label: 'Apply UK VAT on Product',
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
        const orderDelivery = context.order?.deliveryId
          ? await context.modules.orders.deliveries.findDelivery({
              orderDeliveryId: context.order?.deliveryId,
            })
          : null;
        if (
          !isDeliveryAddressInCountry(
            {
              ...context,
              orderDelivery,
            },
            UK_VAT_COUNTRY_CODES,
          )
        ) {
          return pricingAdapter.calculate();
        }

        let taxCategory: UkTaxCategoryResolver | null = resolveUkTaxCategoryFromProduct(context.product);
        if (!taxCategory) {
          // No special tax category found, use default from delivery provider
          const provider = orderDelivery?.deliveryProviderId
            ? await context.modules.delivery.findProvider({
                deliveryProviderId: orderDelivery?.deliveryProviderId,
              })
            : null;
          if (provider) taxCategory = resolveUkTaxCategoryFromDeliveryProvider(provider);
        }
        // If still no tax category found, use default
        if (!taxCategory) taxCategory = UkTaxCategories.STANDARD;

        const taxRate = taxCategory.rate(context.order?.ordered);

        ProductPricingAdapter.log(`ProductUkTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          baseCategory: ProductPricingRowCategory.Item,
          adapterKey: ProductUkTax.key,
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

export default ProductUkTax;
