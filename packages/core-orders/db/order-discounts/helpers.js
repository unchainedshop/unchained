import 'meteor/dburles:collection-helpers';
import { log } from 'meteor/unchained:core-logger';
import { DiscountDirector } from 'meteor/unchained:core-discounting';
import { OrderDiscounts } from './collections';
import { OrderDiscountTrigger } from './schema';
import { Orders } from '../orders/collections';

const ErrorCodes = {
  CODE_ALREADY_PRESENT: 'CODE_ALREADY_PRESENT',
  CODE_NOT_VALID: 'CODE_NOT_VALID'
};

OrderDiscounts.helpers({
  order() {
    return Orders.findOne({
      _id: this.orderId
    });
  },
  interface() {
    const director = new DiscountDirector({ order: this.order() });
    return director.interfaceClass(this.discountKey);
  },
  isValid() {
    const director = new DiscountDirector({ order: this.order() });
    return director.isValid({
      code: this.code,
      discountKey: this.discountKey,
      isTriggerSystem: this.trigger === OrderDiscountTrigger.SYSTEM
    });
  },
  discountConfigurationForCalculation(pricingAdapterKey) {
    const director = new DiscountDirector({ order: this.order() });
    return director.discountConfigurationForCalculation({
      code: this.code,
      discountKey: this.discountKey,
      pricingAdapterKey
    });
  },
  total() {
    return this.order().discountTotal({ orderDiscountId: this._id });
  },
  discounted() {
    return this.order().discounted({ orderDiscountId: this._id });
  }
});

OrderDiscounts.createManualOrderDiscount = async ({
  orderId,
  code,
  ...rest
}) => {
  // Try to grab single-usage-discount
  if (!code) throw new Error(ErrorCodes.CODE_NOT_VALID);
  const fetchedDiscount = OrderDiscounts.grabDiscount({
    orderId,
    code
  });
  if (fetchedDiscount) return fetchedDiscount;
  const order = Orders.findOne({ _id: orderId });
  const director = new DiscountDirector({ order });
  const discountKey = director.resolveDiscountKeyFromStaticCode({ code });
  if (discountKey) {
    const newDiscount = await OrderDiscounts.createDiscount({
      ...rest,
      code,
      orderId,
      discountKey
    });
    if (newDiscount) return newDiscount;
  }
  throw new Error(ErrorCodes.CODE_NOT_VALID);
};

OrderDiscounts.createDiscount = async ({
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
    created: new Date()
  });
  if (normalizedTrigger === OrderDiscountTrigger.USER) {
    await Orders.updateCalculation({
      orderId,
      recalculateEverything: true
    });
  }
  return OrderDiscounts.findOne({
    _id: discountId
  });
};

OrderDiscounts.removeDiscount = async ({ discountId }) => {
  const discount = OrderDiscounts.findOne({ _id: discountId });
  log(`OrderDiscounts -> Remove Discount ${discountId}`, {
    orderId: discount.orderId
  });
  OrderDiscounts.remove({ _id: discountId });
  if (discount.trigger === OrderDiscountTrigger.USER) {
    await Orders.updateCalculation({
      orderId: discount.orderId,
      recalculateEverything: true
    });
  }
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
  OrderDiscounts.update(
    { _id: discount._id },
    {
      $set: {
        orderId,
        updated: new Date()
      }
    }
  );
  return OrderDiscounts.findOne({ _id: discount && discount._id });
};

OrderDiscounts.updateDiscounts = async ({ orderId }) => {
  const order = Orders.findOne({ _id: orderId });
  const director = new DiscountDirector({ order });
  log('Update Discounts', { orderId });

  // 1. go through existing order-discounts and check if discount still valid,
  // those who are not valid anymore should get removed
  await order
    .discounts()
    .filter(discount => !discount.isValid())
    .reduce(
      async (accumulator, { _id }) => [
        ...(await accumulator),
        await OrderDiscounts.removeDiscount({ discountId: _id })
      ],
      []
    );

  // 2. run auto-system discount
  const currentDiscountKeys = order
    .discounts()
    .map(({ discountKey }) => discountKey);

  const isDiscountNotAlreadyAdded = key =>
    currentDiscountKeys.indexOf(key) === -1;

  await director
    .findSystemDiscounts()
    .filter(isDiscountNotAlreadyAdded)
    .reduce(
      async (accumulator, discountKey) => [
        ...(await accumulator),
        await OrderDiscounts.createDiscount({
          orderId,
          discountKey,
          trigger: OrderDiscountTrigger.SYSTEM
        })
      ],
      []
    );
};
