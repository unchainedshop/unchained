import { Context } from '@unchainedshop/types/api';
import { Order, OrderPayment } from '@unchainedshop/types/orders';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { User } from '@unchainedshop/types/user';
import { BasePricingDirector } from '../basePricing/BasePricingDirector';
import {
  PaymentPricingCalculation,
  PaymentPricingSheet,
} from './PaymentPricingSheet';

interface PaymentPricingContext {
  user: User;
  orderPayment: OrderPayment;
  order: Order;
  provider: PaymentProvider;
}

export class PaymentPricingDirector extends BasePricingDirector<
  PaymentPricingContext,
  PaymentPricingCalculation
> {
  constructor(pricingContext: { item: OrderPayment }, requestContext: Context) {
    super(pricingContext, requestContext);
  }

  buildPricingContext({ item }: { item: OrderPayment }) {
    // TODO: use modules
    /* @ts-ignore */
    const order = item.order();
    // TODO: use modules
    /* @ts-ignore */
    const provider = item.provider();
    const user = order.user();
    return {
      order,
      provider,
      user,
      ...item.context,
    };
  }

  resultSheet() {
    return PaymentPricingSheet({
      calculation: this.calculation,
      currency: this.pricingContext.order.currency,
    });
  }
}
