import { Context } from '@unchainedshop/types/api';
import {
  Order,
  OrderDelivery,
  OrderDiscount,
  OrderPayment,
  OrderPosition
} from '@unchainedshop/types/orders';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { User } from '@unchainedshop/types/user';
import { BasePricingDirector } from '../basePricing/BasePricingDirector';
import { ProductPricingCalculation } from 'src/product-pricing';
import {
  OrderPricingCalculation,
  OrderPricingSheet
} from './OrderPricingSheet';

interface OrderPricingContext {
  currency?: string;
  discounts: Array<OrderDiscount>;
  order: Order;
  orderDelivery: OrderDelivery;
  orderPositions: Array<OrderPosition>;
  orderPayment?: OrderPayment;
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
    const orderPayment = order.payment();
    // TODO: use modules
    /* @ts-ignore */
    const discounts = order.discounts();

    return {
      currency: order.currency,
      discounts,
      order,
      orderDelivery,
      orderPositions,
      orderPayment,
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
