import { Context } from '@unchainedshop/types/api';
import {
  Order,
  OrderDelivery,
  OrderDiscount,
} from '@unchainedshop/types/orders';
import { User } from '@unchainedshop/types/user';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BasePricingDirector } from '../basePricing/BasePricingDirector';
import {
  DeliveryPricingCalculation,
  DeliveryPricingSheet,
} from './DeliveryPricingSheet';

interface DeliveryPricingContext {
  country?: string;
  currency?: string;
  deliveryProvider?: any; // TODO: Replace with delivery provider
  discounts: Array<OrderDiscount>;
  order?: Order;
  orderDelivery?: OrderDelivery;
  providerContext?: any;
  quantity?: number;
  user?: User;
}

export class DeliveryPricingDirector extends BasePricingDirector<
  DeliveryPricingContext,
  DeliveryPricingCalculation
> {
  buildPricingContext({
    item,
    ...rest
  }: {
    item: OrderDelivery;
  }): DeliveryPricingContext {
    const { providerContext, ...context } = rest as any;

    if (!item)
      return {
        discounts: [],
        providerContext,
        ...context,
      };

    // TODO: use modules
    /* @ts-ignore */
    const order = item.order();
    /* @ts-ignore */
    const provider = item.provider();
    const user = order.user();
    const discounts = order.discounts();

    return {
      country: order.countryCode,
      currency: order.currency,
      discounts,
      order,
      provider,
      user,
      ...item.context,
      ...context,
    };
  }

  resultSheet() {
    return DeliveryPricingSheet({
      calculation: this.calculation,
      currency: this.pricingContext.currency,
      quantity: this.pricingContext.quantity,
    });
  }
}
