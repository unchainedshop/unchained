import { Context } from '@unchainedshop/types/api';
import { Discount } from '@unchainedshop/types/discounting';
import { Order } from '@unchainedshop/types/orders';
import { User } from '@unchainedshop/types/user';
import { log, LogLevel } from 'meteor/unchained:logger';

export interface BasePricingAdapterContext extends Context {
  order: Order;
  user: User;
}

export class BasePricingAdapter<
  PricingContext extends BasePricingAdapterContext
> {
  static key = '';

  static label = '';

  static version = '';

  static orderIndex = 0;

  static async isActivatedFor(context: BasePricingAdapterContext) {
    return false;
  }

  public context: PricingContext;
  public discounts: Array<Discount>;

  constructor({
    context,
    discounts,
  }: {
    context: PricingContext;
    discounts: Array<Discount>;
  }) {
    this.context = context;
    this.discounts = discounts;
  }

  // eslint-disable-next-line
  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  }
}
