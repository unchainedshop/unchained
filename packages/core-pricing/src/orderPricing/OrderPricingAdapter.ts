import { Context } from '@unchainedshop/types/api';
import { Discount } from '@unchainedshop/types/discounting';
import {
  Order,
  OrderDelivery,
  OrderPayment,
  OrderPosition
} from '@unchainedshop/types/orders';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { User } from '@unchainedshop/types/user';
import { BasePricingAdapter } from '../basePricing/BasePricingAdapter';
import {
  OrderPricingCalculation,
  OrderPricingSheet
} from './OrderPricingSheet';

interface OrderPricingAdapterContext extends Context {
  currency?: string;
  discounts: Array<Discount>;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  orderPayment: OrderPayment;
  user: User;
}

export class OrderPricingAdapter extends BasePricingAdapter<
  OrderPricingAdapterContext,
  OrderPricingCalculation
> {
  static async isActivatedFor(context: OrderPricingAdapterContext) {
    return false;
  }

  public calculation;
  public result;

  constructor({
    context,
    calculation,
    discounts,
  }: {
    context: OrderPricingAdapterContext;
    calculation: Array<OrderPricingCalculation>;
    discounts: Array<Discount>;
  }) {
    super({ context, calculation, discounts });

    const { currency } = this.context;
    this.calculation = OrderPricingSheet({ calculation, currency });
    this.result = OrderPricingSheet({ currency });
  }

  async calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Order Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }
}
