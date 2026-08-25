import {
  ProductPricingAdapter,
  type IProductPricingAdapter,
  ProductPricingRowCategory,
} from '@unchainedshop/core';
import {
  resolveEuTaxCategoryFromDeliveryProvider,
  resolveEuTaxCategoryFromProduct,
  resolveEuTaxRate,
} from '../tax/eu.ts';
import resolveDeliveryLocation from '../utils/resolveDeliveryLocation.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

// Destination-based EU VAT: the delivery country selects the rate table, the
// product's `eu-tax-category:<name>` tag (or the delivery provider's
// `eu-tax-category` configuration) selects the category, defaulting to the
// standard rate. Cross-border regimes (OSS thresholds, B2B reverse charge,
// exemptions) are out of scope — model those with dedicated adapters.

export const ProductEuTax: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-eu-tax',
  version: '1.0.0',
  label: 'Apply EU VAT on Product',
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
        const { countryCode } = resolveDeliveryLocation({ ...context, orderDelivery });

        let category = resolveEuTaxCategoryFromProduct(context.product);
        if (!category) {
          // No special tax category found, use default from delivery provider
          const provider = orderDelivery?.deliveryProviderId
            ? await context.modules.delivery.findProvider({
                deliveryProviderId: orderDelivery?.deliveryProviderId,
              })
            : null;
          if (provider) category = resolveEuTaxCategoryFromDeliveryProvider(provider);
        }

        const taxRate = resolveEuTaxRate({
          countryCode,
          category,
          referenceDate: context.order?.ordered,
        });
        // not an EU destination
        if (taxRate === null) return pricingAdapter.calculate();

        ProductPricingAdapter.log(`ProductEuTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          baseCategory: ProductPricingRowCategory.Item,
          adapterKey: ProductEuTax.key,
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

export default ProductEuTax;
