import {
  ProductPricingAdapter,
  type IProductPricingAdapter,
  ProductPricingRowCategory,
} from '@unchainedshop/core';
import {
  resolveTaxCategoryFromDeliveryProvider,
  resolveTaxCategoryFromProduct,
  SwissTaxCategories,
  type SwissTaxCategoryResolver,
} from '../tax/ch.ts';
import isDeliveryAddressInCountry from '../utils/isDeliveryAddressInCountry.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

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
            ['CH', 'LI'],
          )
        ) {
          return pricingAdapter.calculate();
        }

        let taxCategory: SwissTaxCategoryResolver | null = resolveTaxCategoryFromProduct(
          context.product,
        );
        if (!taxCategory) {
          // No special tax category found, use default from delivery provider
          const provider = orderDelivery?.deliveryProviderId
            ? await context.modules.delivery.findProvider({
                deliveryProviderId: orderDelivery?.deliveryProviderId,
              })
            : null;
          if (provider) taxCategory = resolveTaxCategoryFromDeliveryProvider(provider);
        }
        // If still no tax category found, use default
        if (!taxCategory) taxCategory = SwissTaxCategories.DEFAULT;

        const taxRate = taxCategory.rate(context.order?.ordered);

        ProductPricingAdapter.log(`ProductSwissTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          baseCategory: ProductPricingRowCategory.Item,
          adapterKey: ProductSwissTax.key,
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

export default ProductSwissTax;
