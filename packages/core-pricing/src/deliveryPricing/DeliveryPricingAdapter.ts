import { Context } from '@unchainedshop/types/api';
import { Discount } from '@unchainedshop/types/discounting';
import { Order, OrderDelivery } from '@unchainedshop/types/orders';
import { User } from '@unchainedshop/types/user';
import { BasePricingAdapter } from '../basePricing/BasePricingAdapter';
import {
  DeliveryPricingCalculation,
  DeliveryPricingSheet,
} from './DeliveryPricingSheet';

export interface DeliveryPricingAdapterContext extends Context {
  country?: string;
  currency?: string;
  deliveryProvider: any; // TODO: Replace with delivery provider
  discounts: Array<Discount>;
  order: Order;
  orderDelivery: OrderDelivery;
  quantity: number;
  user: User;
}

export class DeliveryPricingAdapter extends BasePricingAdapter<
  DeliveryPricingAdapterContext,
  DeliveryPricingCalculation
> {
  static async isActivatedFor(context: DeliveryPricingAdapterContext) {
    return false;
  }

  public calculation
  public result;

  constructor({
    context,
    calculation,
    discounts,
  }: {
    context: DeliveryPricingAdapterContext;
    calculation: Array<DeliveryPricingCalculation>;
    discounts: Array<Discount>;
  }) {
    super({ context, calculation, discounts });

    const { currency } = context;
    this.calculation = DeliveryPricingSheet({ calculation, currency });
    this.result = DeliveryPricingSheet({ currency });
  }

  async calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Delivery Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }
}
