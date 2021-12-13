import { Context } from '@unchainedshop/types/api';
import { Discount } from '@unchainedshop/types/discounting';
import {
  Order,
  OrderDelivery,
  OrderPosition,
} from '@unchainedshop/types/orders';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { User } from '@unchainedshop/types/user';
import { BasePricingAdapter } from 'src/basePricing/BasePricingAdapter';
import {
  OrderPricingCalculation,
  OrderPricingSheet,
} from './OrderPricingSheet';

interface OrderPricingAdapterContext extends Context {
  discounts: Array<Discount>;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  paymentProvider: PaymentProvider;
  user: User;
}

export class OrderPricingAdapter extends BasePricingAdapter<OrderPricingAdapterContext> {
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
    super({ context, discounts });
    const { currency } = this.context.order;
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
