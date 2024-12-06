import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { OrderDiscountTrigger } from '../db/OrderDiscountTrigger.js';
import { OrderDiscountDirector } from '@unchainedshop/core';
import { Order, OrderDiscount } from '../types.js';
import {
  IPricingSheet,
  PricingCalculation,
  DiscountAdapterActions,
  DiscountContext,
} from '@unchainedshop/utils';

export type OrderDiscountsModule = {
  // Queries
  findOrderDiscount: (
    params: { discountId: string },
    options?: mongodb.FindOptions,
  ) => Promise<OrderDiscount>;
  findOrderDiscounts: (params: { orderId: string }) => Promise<Array<OrderDiscount>>;

  // Transformations
  interface: (orderDiscount: OrderDiscount, unchainedAPI) => Promise<DiscountAdapterActions<any>>;

  isValid: (orderDiscount: OrderDiscount, unchainedAPI) => Promise<boolean>;

  // Adapter
  configurationForPricingAdapterKey: (
    orderDiscount: OrderDiscount,
    adapterKey: string,
    calculationSheet: IPricingSheet<PricingCalculation>,
    pricingContext: DiscountContext,
  ) => Promise<any>;

  // Mutations
  createManualOrderDiscount: (
    params: { code: string; order: Order },
    unchainedAPI,
  ) => Promise<OrderDiscount>;

  create: (doc: OrderDiscount) => Promise<OrderDiscount>;
  update: (orderDiscountId: string, doc: OrderDiscount) => Promise<OrderDiscount>;
  delete: (orderDiscountId: string, unchainedAPI) => Promise<OrderDiscount>;
};

const ORDER_DISCOUNT_EVENTS: string[] = [
  'ORDER_CREATE_DISCOUNT',
  'ORDER_UPDATE_DISCOUNT',
  'ORDER_REMOVE_DISCOUNT',
  'ORDER_ADD_DISCOUNT',
];

const OrderDiscountErrorCode = {
  CODE_ALREADY_PRESENT: 'CODE_ALREADY_PRESENT',
  CODE_NOT_VALID: 'CODE_NOT_VALID',
};

export const buildFindByIdSelector = (orderDiscountId: string) =>
  generateDbFilterById(orderDiscountId) as mongodb.Filter<OrderDiscount>;

export const configureOrderDiscountsModule = ({
  OrderDiscounts,
}: {
  OrderDiscounts: mongodb.Collection<OrderDiscount>;
}): OrderDiscountsModule => {
  registerEvents(ORDER_DISCOUNT_EVENTS);

  const getAdapter = async (orderDiscount: OrderDiscount, unchainedAPI) => {
    const order = await unchainedAPI.modules.orders.findOrder({
      orderId: orderDiscount.orderId,
    });
    const Adapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
    if (!Adapter) return null;
    const adapter = await Adapter.actions({
      context: { order, orderDiscount, code: orderDiscount.code, ...unchainedAPI },
    });
    return adapter;
  };

  const createDiscount: OrderDiscountsModule['create'] = async (doc) => {
    const normalizedTrigger = doc.trigger || OrderDiscountTrigger.USER;
    const { insertedId: discountId } = await OrderDiscounts.insertOne({
      _id: generateDbObjectId(),
      created: new Date(),
      ...doc,
      trigger: normalizedTrigger,
    });
    const discount = await OrderDiscounts.findOne(buildFindByIdSelector(discountId));
    return discount;
  };

  const deleteDiscount: OrderDiscountsModule['delete'] = async (orderDiscountId, unchainedAPI) => {
    const selector = buildFindByIdSelector(orderDiscountId);
    const discount = await OrderDiscounts.findOne(selector, {});
    if (discount.trigger === OrderDiscountTrigger.USER) {
      // Release
      const adapter = await getAdapter(discount, unchainedAPI);
      if (!adapter) return null;
      await adapter.release();
    }
    await OrderDiscounts.deleteOne(selector);
    await emit('ORDER_REMOVE_DISCOUNT', { discount });
    return discount;
  };

  const updateDiscount: OrderDiscountsModule['update'] = async (orderDiscountId, doc) => {
    const discount = await OrderDiscounts.findOneAndUpdate(
      generateDbFilterById(orderDiscountId),
      {
        $set: {
          updated: new Date(),
          ...doc,
        },
      },
      { returnDocument: 'after' },
    );
    await emit('ORDER_UPDATE_DISCOUNT', { discount });
    return discount;
  };

  const reserveDiscount = async (orderDiscount: OrderDiscount, unchainedAPI) => {
    const adapter = await getAdapter(orderDiscount, unchainedAPI);
    if (!adapter) return null;

    const reservation = await adapter.reserve({
      code: orderDiscount.code,
    });

    return updateDiscount(orderDiscount._id, { orderId: orderDiscount.orderId, reservation });
  };

  const grabDiscount = async ({ code, orderId }: { code: string; orderId: string }, unchainedAPI) => {
    const existingDiscount = await OrderDiscounts.findOne({ code, orderId });
    if (existingDiscount) throw new Error(OrderDiscountErrorCode.CODE_ALREADY_PRESENT);
    const discount = await OrderDiscounts.findOne({ code, orderId: null });
    if (!discount) return null;
    const discountId = discount._id;
    try {
      const updatedDiscount = await updateDiscount(discountId, { orderId });
      const reservedDiscount = await reserveDiscount(updatedDiscount, unchainedAPI);
      return reservedDiscount;
    } catch (error) {
      // Rollback
      await updateDiscount(discountId, { orderId: discount.orderId });

      throw error;
    }
  };

  return {
    // Queries
    findOrderDiscount: async ({ discountId }, options) => {
      return OrderDiscounts.findOne(buildFindByIdSelector(discountId), options);
    },
    findOrderDiscounts: async ({ orderId }) => {
      const discounts = OrderDiscounts.find({ orderId });
      return discounts.toArray();
    },

    // Transformations
    interface: async (orderDiscount, unchainedAPI) => {
      const adapter = await getAdapter(orderDiscount, unchainedAPI);
      return adapter;
    },

    isValid: async (orderDiscount, unchainedAPI) => {
      const adapter = await getAdapter(orderDiscount, unchainedAPI);
      if (!adapter) return null;

      if (orderDiscount.trigger === OrderDiscountTrigger.SYSTEM) {
        return adapter.isValidForSystemTriggering();
      }

      return adapter.isValidForCodeTriggering({
        code: orderDiscount.code,
      });
    },

    // Adapter
    configurationForPricingAdapterKey: async (
      orderDiscount,
      adapterKey,
      calculationSheet,
      unchainedAPI,
    ) => {
      const adapter = await getAdapter(orderDiscount, unchainedAPI);
      if (!adapter) return null;

      return adapter.discountForPricingAdapterKey({
        pricingAdapterKey: adapterKey,
        calculationSheet,
      });
    },

    // Mutations
    createManualOrderDiscount: async ({ order, code }, unchainedAPI) => {
      // Try to grab single-usage-discount
      if (!code) throw new Error(OrderDiscountErrorCode.CODE_NOT_VALID);

      const fetchedDiscount = await grabDiscount({ code, orderId: order._id }, unchainedAPI);
      if (fetchedDiscount) return fetchedDiscount;

      const director = await OrderDiscountDirector.actions({ order, code }, unchainedAPI);
      const discountKey = await director.resolveDiscountKeyFromStaticCode({
        code,
      });

      if (discountKey) {
        const newDiscount = await createDiscount({
          orderId: order._id,
          code,
          discountKey,
        });

        try {
          const reservedDiscount = await reserveDiscount(newDiscount, unchainedAPI);
          await emit('ORDER_ADD_DISCOUNT', { discount: reserveDiscount });
          return reservedDiscount;
        } catch (error) {
          await deleteDiscount(newDiscount._id, unchainedAPI);
          throw error;
        }
      }

      throw new Error(OrderDiscountErrorCode.CODE_NOT_VALID);
    },

    create: async (doc) => {
      const discount = await createDiscount(doc);

      if (discount.trigger === OrderDiscountTrigger.USER) {
        await emit('ORDER_CREATE_DISCOUNT', { discount });
      }

      return discount;
    },

    delete: deleteDiscount,

    update: async (orderDiscountId, doc) => {
      const discount = await OrderDiscounts.findOneAndUpdate(
        generateDbFilterById(orderDiscountId),
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_UPDATE_DISCOUNT', { discount });
      return discount;
    },
  };
};
