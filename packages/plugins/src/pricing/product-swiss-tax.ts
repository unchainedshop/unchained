import { ProductPricingDirector, ProductPricingAdapter } from '@unchainedshop/core-products';
import {
  IProductPricingAdapter,
  ProductPricingAdapterContext,
} from '@unchainedshop/types/products.pricing.js';

export const SwissTaxCategories = {
  DEFAULT: {
    rate: () => {
      return 0.077;
    },
  },
  REDUCED: {
    tag: 'swiss-tax-category:reduced',
    rate: () => {
      return 0.025;
    },
  },
  SPECIAL: {
    tag: 'swiss-tax-category:special',
    rate: () => {
      return 0.037;
    },
  },
};

const getTaxRate = (context: ProductPricingAdapterContext) => {
  const { product } = context;

  if (product.tags?.includes(SwissTaxCategories.REDUCED.tag)) {
    return SwissTaxCategories.REDUCED.rate();
  }
  if (product.tags?.includes(SwissTaxCategories.SPECIAL.tag)) {
    return SwissTaxCategories.SPECIAL.rate();
  }
  return SwissTaxCategories.DEFAULT.rate();
};

const isDeliveryAddressInSwitzerland = async ({ order, country, modules }) => {
  let countryCode = country?.toUpperCase().trim();

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

const ProductSwissTax: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-swiss-tax',
  version: '1.0.0',
  label: 'Apply Swiss Tax on Product',
  orderIndex: 20,

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
              meta: { adapter: ProductSwissTax.key },
            });
          } else {
            const taxAmount = row.amount * taxRate;
            pricingAdapter.resultSheet().addTax({
              amount: taxAmount,
              rate: taxRate,
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
