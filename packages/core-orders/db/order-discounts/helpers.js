import 'meteor/dburles:collection-helpers';
import { log } from 'meteor/unchained:core-logger';
import { DiscountDirector } from 'meteor/unchained:core-discounting';
import { OrderDiscounts } from './collections';
import { OrderDiscountTrigger } from './schema';
import { Orders } from '../orders/collections';

const ErrorCodes = {
  CODE_ALREADY_PRESENT: 'CODE_ALREADY_PRESENT',
  CODE_NOT_VALID: 'CODE_NOT_VALID',
};

OrderDiscounts.helpers({
  order() {
    return Orders.findOne({
      _id: this.orderId,
    });
  },
  interface() {
    const director = new DiscountDirector({
      order: this.order(),
      orderDiscount: this,
    });
    return director.interface(this.discountKey);
  },
  updateContext(context) {
    return OrderDiscounts.updateDiscount({
      discountId: this._id,
      context,
    });
  },
  async isValid(options) {
    const adapter = this.interface();
    if (!adapter) return null;
    if (this.trigger === OrderDiscountTrigger.SYSTEM)
      return adapter.isValidForSystemTriggering(options);
    return adapter.isValidForCodeTriggering({
      ...options,
      code: this.code,
    });
  },
  async reserve() {
    const adapter = this.interface();
    if (!adapter) return null;
    const reservation = await adapter.reserve({
      code: this.code,
    });
    return OrderDiscounts.updateDiscount({ discountId: this._id, reservation });
  },
  async release() {
    const adapter = this.interface();
    if (!adapter) return null;
    await adapter.release();
    return OrderDiscounts.updateDiscount({
      discountId: this._id,
      reservation: null,
    });
  },
  configurationForPricingAdapterKey(pricingAdapterKey, calculation) {
    const adapter = this.interface();
    if (!adapter) return null;
    return adapter.discountForPricingAdapterKey({
      pricingAdapterKey,
      calculation,
    });
  },
  total() {
    return this.order().discountTotal({ orderDiscountId: this._id });
  },
  discounted() {
    return this.order().discounted({ orderDiscountId: this._id });
  },
});

OrderDiscounts.createManualOrderDiscount = ({ orderId, code, ...rest }) => {
  // Try to grab single-usage-discount
  if (!code) throw new Error(ErrorCodes.CODE_NOT_VALID);
  const fetchedDiscount = OrderDiscounts.grabDiscount({
    orderId,
    code,
  });
  if (fetchedDiscount) return fetchedDiscount;
  const order = Orders.findOne({ _id: orderId });
  const director = new DiscountDirector({ order });
  const discountKey = Promise.await(
    director.resolveDiscountKeyFromStaticCode({ code })
  );
  if (discountKey) {
    const newDiscount = OrderDiscounts.createDiscount({
      ...rest,
      code,
      orderId,
      discountKey,
    });
    let reservedDiscount;
    try {
      reservedDiscount = Promise.await(newDiscount.reserve());
    } catch (e) {
      // Rollback
      OrderDiscounts.removeDiscount({ discountId: newDiscount._id });
      throw e;
    }
    Orders.updateCalculation({
      orderId,
    });
    return reservedDiscount;
  }
  throw new Error(ErrorCodes.CODE_NOT_VALID);
};

OrderDiscounts.createDiscount = ({
  orderId,
  discountKey,
  trigger,
  ...rest
}) => {
  const normalizedTrigger = trigger || OrderDiscountTrigger.USER;
  log(
    `Create Order Discount: ${discountKey} with trigger ${normalizedTrigger}`,
    { orderId }
  );
  const discountId = OrderDiscounts.insert({
    ...rest,
    trigger: normalizedTrigger,
    orderId,
    discountKey,
    created: new Date(),
  });
  return OrderDiscounts.findOne({
    _id: discountId,
  });
};

OrderDiscounts.updateDiscount = ({ discountId, ...rest }) => {
  OrderDiscounts.update(
    { _id: discountId },
    {
      $set: {
        updated: new Date(),
        ...rest,
      },
    }
  );
  return OrderDiscounts.findOne({ _id: discountId });
};

OrderDiscounts.removeDiscount = ({ discountId }) => {
  const discount = OrderDiscounts.findOne({ _id: discountId });
  log(`OrderDiscounts -> Remove Discount ${discountId}`, {
    orderId: discount.orderId,
  });
  if (discount.trigger === OrderDiscountTrigger.USER) {
    Promise.await(discount.release());
    OrderDiscounts.remove({ _id: discountId });
    Orders.updateCalculation({
      orderId: discount.orderId,
    });
    return discount;
  }
  OrderDiscounts.remove({ _id: discountId });
  return discount;
};

OrderDiscounts.grabDiscount = ({ code, orderId }) => {
  log(`OrderDiscounts -> Try to grab ${code}`, { orderId });
  const existingDiscount = OrderDiscounts.findOne({ code, orderId });
  if (existingDiscount) {
    throw new Error(ErrorCodes.CODE_ALREADY_PRESENT);
  }
  const discount = OrderDiscounts.findOne({ code, orderId: null });
  if (!discount) return null;
  try {
    const updatedDiscount = OrderDiscounts.updateDiscount({
      discountId: discount._id,
      orderId,
    });
    return Promise.await(updatedDiscount.reserve());
  } catch (e) {
    // Rollback
    OrderDiscounts.updateDiscount({
      discountId: discount._id,
      orderId: discount.orderId,
      updated: discount.updated,
    });
    throw e;
  }
};

OrderDiscounts.updateDiscounts = ({ orderId }) => {
  // 1. go through existing order-discounts and check if discount still valid,
  // those who are not valid anymore should get removed
  const order = Orders.findOne({ _id: orderId });
  Promise.await(
    Promise.all(
      order.discounts().map(async (discount) => {
        const isValid = await discount.isValid();
        if (!isValid) {
          OrderDiscounts.removeDiscount({ discountId: discount._id });
        }
      })
    )
  );

  // 2. run auto-system discount
  const currentDiscountKeys = order
    .discounts()
    .map(({ discountKey }) => discountKey);
  const director = new DiscountDirector({ order });
  Promise.await(director.findSystemDiscounts())
    .filter((key) => currentDiscountKeys.indexOf(key) === -1)
    .forEach((discountKey) =>
      OrderDiscounts.createDiscount({
        orderId,
        discountKey,
        trigger: OrderDiscountTrigger.SYSTEM,
      })
    );
};
