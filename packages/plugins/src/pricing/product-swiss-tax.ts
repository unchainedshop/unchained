import {
  ProductPricingDirector,
  ProductPricingAdapter,
  type IProductPricingAdapter,
  ProductPricingRowCategory,
} from '@unchainedshop/core';
import {
  resolveTaxCategoryFromDeliveryProvider,
  resolveTaxCategoryFromProduct,
  SwissTaxCategories,
  type SwissTaxCategoryResolver,
} from './tax/ch.js';
import isDeliveryAddressInCountry from './utils/isDeliveryAddressInCountry.js';

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
