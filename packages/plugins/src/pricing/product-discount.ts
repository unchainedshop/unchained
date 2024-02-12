import type { Discount } from '@unchainedshop/types/discount.js';
import {
  IProductPricingAdapter,
  ProductPricingRowCategory,
} from '@unchainedshop/types/products.pricing.js';
import { ProductPricingDirector, ProductPricingAdapter } from '@unchainedshop/core-products';
import { calculation as calcUtils } from '@unchainedshop/utils';
import { Product } from '@unchainedshop/types/products.js';

const ProductDiscount: IProductPricingAdapter = {
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

    const addDiscount = (discount: Discount<Product>, total: number, isTaxable: boolean) => {
      const { configuration, discountId } = discount;
      const { isNetPrice = false, ...meta } = configuration;
      const amount = calcUtils.applyRate(configuration, total);

      pricingAdapter.resultSheet().addDiscount({
        amount: amount * -1,
        discountId,
        isNetPrice,
        isTaxable,
        meta: { adapter: ProductDiscount.key, ...meta },
      });
    };

    return {
      ...pricingAdapter,

      calculate: async () => {
        const taxableTotal = params.calculationSheet.sum({
          category: ProductPricingRowCategory.Item,
          isTaxable: true,
        });
        const nonTaxableTotal = params.calculationSheet.sum({
          category: ProductPricingRowCategory.Item,
          isTaxable: false,
        });

        params.discounts.forEach((discount) => {
          if (taxableTotal !== 0) {
            addDiscount(discount, taxableTotal, true);
          }
          if (nonTaxableTotal !== 0) {
            addDiscount(discount, nonTaxableTotal, false);
          }
        });

        return pricingAdapter.calculate();
      },
    };
  },
};

ProductPricingDirector.registerAdapter(ProductDiscount);
