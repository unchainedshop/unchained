import { Context } from '@unchainedshop/types/api';
import {
  Order,
  OrderDelivery,
  OrderDiscount,
  OrderPosition
} from '@unchainedshop/types/orders';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { User } from '@unchainedshop/types/user';
import { BasePricingDirector } from 'src/basePricing/BasePricingDirector';
import {
  OrderPricingCalculation,
  OrderPricingSheet
} from './OrderPricingSheet';

interface OrderPricingContext {
  discounts: Array<OrderDiscount>;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  paymentProvider: PaymentProvider;
  user: User;
}

export class OrderPricingDirector extends BasePricingDirector<
  OrderPricingContext,
  OrderPricingCalculation
> {
  constructor(pricingContext: { order: Order }, requestContext: Context) {
    super(pricingContext, requestContext);
  }

  buildPricingContext({ order }: { order: Order }): OrderPricingContext {
    // TODO: use modules
    /* @ts-ignore */
    const user = order.user();
    // TODO: use modules
    /* @ts-ignore */
    const orderPositions = order.items();
    // TODO: use modules
    /* @ts-ignore */
    const orderDelivery = order.delivery();
    // TODO: use modules
    /* @ts-ignore */
    const paymentProvider = order.payment();
    // TODO: use modules
    /* @ts-ignore */
    const discounts = order.discounts();

    return {
      discounts,
      order,
      orderDelivery,
      orderPositions,
      paymentProvider,
      user,
    };
  }

  resultSheet() {
    const pricingSheet = OrderPricingSheet({
      calculation: this.calculation,
      currency: this.pricingContext.order.currency,
    });

    return pricingSheet;
  }
}
