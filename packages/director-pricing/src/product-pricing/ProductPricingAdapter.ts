import { Context } from '@unchainedshop/types/api';
import { Discount } from '@unchainedshop/types/discounting';
import { Order } from '@unchainedshop/types/orders';
import { User } from '@unchainedshop/types/user';
import { ProductPricingCalculation } from '.';
import { BasePricingAdapter } from '../basePricing/BasePricingAdapter';
import { ProductPricingSheet } from './ProductPricingSheet';

export interface ProductPricingAdapterContext extends Context {
  country: string;
  currency: string;
  discounts: Array<Discount>;
  order: Order;
  product: any; // TODO: update with product type
  quantity: number;
  user: User;
}

export class ProductPricingAdapter extends BasePricingAdapter<ProductPricingAdapterContext, ProductPricingCalculation> {
  public calculation;
  public result;

  constructor({ context, calculation, discounts }) {
    super({ context, calculation, discounts });

    const { currency, quantity } = context;
    this.calculation = ProductPricingSheet({
      calculation,
      currency,
      quantity,
    });
    this.result = ProductPricingSheet({ currency, quantity });
  }

  async calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    if (!resultRaw.length && !this.calculation.getRawPricingSheet().length)
      return null;
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Item Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }

  resetCalculation() {
    // revert old prices
    this.calculation.filterBy().forEach(({ amount, ...row }) => {
      this.result.calculation.push({
        ...row,
        amount: amount * -1,
      });
    });
  }
}
