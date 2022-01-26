/* @ts-ignore */
import moment from 'moment';
import { ProductPricingDirector, ProductPricingAdapter } from 'meteor/unchained:core-products';
import {
  IProductPricingAdapter,
  ProductPricingAdapterContext,
} from '@unchainedshop/types/products.pricing';

// https://www.ch.ch/de/mehrwertsteuersatz-schweiz/
export const SwissTaxCategories = {
  DEFAULT: {
    rate: (date) => {
      const referenceDate = moment(date);
      if (referenceDate.isBefore('2018-01-01')) {
        return 0.08;
      }
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
  const date = context.order && context.order.ordered ? new Date(context.order.ordered) : new Date();
  const { product } = context;

  if (product.tags?.includes(SwissTaxCategories.REDUCED.tag)) {
    return SwissTaxCategories.REDUCED.rate();
  }
  if (product.tags?.includes(SwissTaxCategories.SPECIAL.tag)) {
    return SwissTaxCategories.SPECIAL.rate();
  }
  return SwissTaxCategories.DEFAULT.rate(date);
};

const ProductSwissTax: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-swiss-tax',
  version: '1.0',
  label: 'Apply Swiss Tax on Product',
  orderIndex: 20,

  isActivatedFor: async ({ country, order, modules }) => {
    let countryCode = country?.toUpperCase().trim();
    if (order) {
      const orderDelivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });

      const address = orderDelivery?.context?.address || order.billingAddress;

      if (address?.countryCode !== undefined) {
        countryCode = address.countryCode.toUpperCase().trim();
      }
    }

    return countryCode === 'CH' || countryCode === 'LI';
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,

      calculate: async () => {
        const taxRate = getTaxRate(params.context);
        ProductPricingAdapter.log(`ProductSwissTax -> Tax Multiplicator: ${taxRate}`);
        pricingAdapter
          .calculationSheet()
          .filterBy({ isTaxable: true })
          .forEach(({ isNetPrice, ...row }) => {
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
