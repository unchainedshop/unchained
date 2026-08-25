import {
  ProductPricingAdapter,
  type IProductPricingAdapter,
  ProductPricingRowCategory,
} from '@unchainedshop/core';
import { US_COUNTRY_CODE, isProductExemptFromUsSalesTax, resolveUsSalesTaxRate } from '../tax/us.ts';
import resolveDeliveryLocation from '../utils/resolveDeliveryLocation.ts';
import { applyTaxRateToTaxableRows } from '../tax/applyTaxRateToTaxableRows.ts';

export const ProductUsSalesTax: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-us-sales-tax',
  version: '1.0.0',
  label: 'Apply US State Sales Tax on Product',
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
        if (isProductExemptFromUsSalesTax(context.product)) {
          return pricingAdapter.calculate();
        }

        const orderDelivery = context.order?.deliveryId
          ? await context.modules.orders.deliveries.findDelivery({
              orderDeliveryId: context.order?.deliveryId,
            })
          : null;
        const { countryCode, regionCode } = resolveDeliveryLocation({ ...context, orderDelivery });
        if (countryCode !== US_COUNTRY_CODE) return pricingAdapter.calculate();

        const taxRate = resolveUsSalesTaxRate({
          regionCode,
          referenceDate: context.order?.ordered,
        });
        if (taxRate === null) {
          // without a known state there is no defensible fallback rate
          ProductPricingAdapter.log(
            `ProductUsSalesTax -> unknown state '${regionCode}', no sales tax applied`,
          );
          return pricingAdapter.calculate();
        }

        ProductPricingAdapter.log(`ProductUsSalesTax -> Tax Multiplicator: ${taxRate}`);
        applyTaxRateToTaxableRows({
          calculationSheet: params.calculationSheet,
          resultSheet: pricingAdapter.resultSheet(),
          taxRate,
          baseCategory: ProductPricingRowCategory.Item,
          adapterKey: ProductUsSalesTax.key,
        });
        return pricingAdapter.calculate();
      },
    };
  },
};

export default ProductUsSalesTax;
