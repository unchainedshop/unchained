import { Context } from '@unchainedshop/types/api';
import { Order, OrderPayment } from '@unchainedshop/types/orders';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { User } from '@unchainedshop/types/user';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BasePricingAdapter } from 'src/basePricing/BasePricingAdapter';
import {
  PaymentPricingCalculation,
  PaymentPricingSheet,
} from './PaymentPricingSheet';

export interface PaymentPricingAdapterContext extends Context {
  user: User;
  orderPayment: OrderPayment;
  order: Order;
  provider: PaymentProvider;
}

export class PaymentPricingAdapter extends BasePricingAdapter<PaymentPricingAdapterContext> {
  static async isActivatedFor(context: PaymentPricingAdapterContext) {
    return false;
  }

  public calculation;
  public result;

  constructor({ context, calculation }) {
    super({ context, discounts: [] });

    const { currency } = this.context.order;
    this.calculation = PaymentPricingSheet({ calculation, currency });
    this.result = PaymentPricingSheet({ currency });
  }

  async calculate() {
    const resultRaw = this.result.getRawPricingSheet();
    resultRaw.forEach(({ amount, category }) =>
      this.log(`Payment Calculation -> ${category} ${amount}`)
    );
    return resultRaw;
  }
}

