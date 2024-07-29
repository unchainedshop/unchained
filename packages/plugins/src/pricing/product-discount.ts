import type { Discount } from '@unchainedshop/types/discount.js';
import { IProductPricingAdapter, ProductPricingRowCategory } from '@unchainedshop/core-products';
import {
  ProductPricingDirector,
  ProductPricingAdapter,
  ProductDiscountConfiguration,
} from '@unchainedshop/core-products';
import { calculation as calcUtils } from '@unchainedshop/utils';

const ProductDiscount: IProductPricingAdapter<ProductDiscountConfiguration> = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-discount',
  version: '1.0.0',
  label: 'Apply Discounts on Product Price',
  orderIndex: 30,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    const addDiscounts = (
      discount: Discount<ProductDiscountConfiguration>,
      total: number,
      resolvedConfiguration: ProductDiscountConfiguration,
    ) => {
      const { discountId } = discount;
      const { isNetPrice = false, taxRate, ...meta } = resolvedConfiguration;
      const amount = calcUtils.applyRate(resolvedConfiguration, total);
      const isTaxable = taxRate === undefined || taxRate === null;

      pricingAdapter.resultSheet().addDiscount({
        amount: amount * -1,
        discountId,
        isNetPrice,
        isTaxable,
        meta: { adapter: ProductDiscount.key, ...meta },
      });
      if (!isTaxable && taxRate) {
        const taxAmount = calcUtils.getTaxAmount(amount, taxRate, isNetPrice);
        pricingAdapter.resultSheet().addTax({
          amount: taxAmount * -1,
          rate: taxRate,
          discountId,
          baseCategory: ProductPricingRowCategory.Discount,
          meta: { adapter: ProductDiscount.key, discountId, ...meta },
        });
        if (!isNetPrice) {
          pricingAdapter.resultSheet().addDiscount({
            amount: taxAmount,
            discountId,
            isNetPrice: false,
            isTaxable: false,
            meta: { adapter: ProductDiscount.key, discountId, ...meta },
          });
        }
      }
    };

    return {
      ...pricingAdapter,

      calculate: async () => {
        params.discounts.forEach((discount) => {
          const { configuration } = discount;

          const resolvedConfiguration = configuration.customPriceConfigurationResolver
            ? configuration.customPriceConfigurationResolver(
                params.context.product,
                params.context.quantity,
                params.context.configuration,
              )
            : configuration;

          if (!resolvedConfiguration) return;

          const total = params.calculationSheet.total({
            category: ProductPricingRowCategory.Item,
            useNetPrice: resolvedConfiguration.isNetPrice,
          });

          addDiscounts(discount, total.amount, resolvedConfiguration);
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductDiscount);
