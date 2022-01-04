import { Context } from '@unchainedshop/types/api';
import {
  Collection,
  Filter,
  ModuleMutations,
} from '@unchainedshop/types/common';
import {
  OrderDiscountsModule,
  OrderDiscount,
} from '@unchainedshop/types/orders.discounts';
import { OrderDiscountDirector } from '../director/OrderDiscountDirector';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
  objectInvert,
  dbIdToString,
} from 'meteor/unchained:utils';
import { OrderDiscountsSchema } from '../db/OrderDiscountsSchema';
import { OrderPricingSheet } from '../director/OrderPricingSheet';
import { OrderDiscountTrigger } from '../db/OrderDiscountTrigger';
import { OrdersModule } from '@unchainedshop/types/orders';

const ORDER_DISCOUNT_EVENTS: string[] = [
  'ORDER_CREATE_DISCOUNT',
  'ORDER_UPDATE_DISCOUNT',
  'ORDER_REMOVE_DISCOUNT',
];

const OrderDiscountErrorCode = {
  CODE_ALREADY_PRESENT: 'CODE_ALREADY_PRESENT',
  CODE_NOT_VALID: 'CODE_NOT_VALID',
};

const buildFindByIdSelector = (orderDiscountId: string) =>
  generateDbFilterById(orderDiscountId) as Filter<OrderDiscount>;

export const configureOrderDiscountsModule = ({
  OrderDiscounts,
  updateCalculation,
}: {
  OrderDiscounts: Collection<OrderDiscount>;
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderDiscountsModule => {
  registerEvents(ORDER_DISCOUNT_EVENTS);

  const mutations = generateDbMutations<OrderDiscount>(
    OrderDiscounts,
    OrderDiscountsSchema
  ) as ModuleMutations<OrderDiscount>;

  const getAdapter = async (
    orderDiscount: OrderDiscount,
    requestContext: Context
  ) => {
    const order = await requestContext.modules.orders.findOrder({
      orderId: orderDiscount.orderId,
    });
    const Adapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
    const adapter = Adapter.actions({
      context: { order, orderDiscount, ...requestContext },
    });
    return adapter;
  };

  const createDiscount: OrderDiscountsModule['create'] = async (
    doc,
    userId
  ) => {
    const normalizedTrigger = doc.trigger || OrderDiscountTrigger.USER;

    log(
      `Create Order Discount: ${doc.discountKey} with trigger ${normalizedTrigger}`,
      { orderId: doc.orderId }
    );

    const discountId = await mutations.create(
      { ...doc, trigger: normalizedTrigger },
      userId
    );
    const discount = await OrderDiscounts.findOne(
      buildFindByIdSelector(discountId)
    );
    return discount;
  };

  const deleteDiscount: OrderDiscountsModule['delete'] = async (
    orderDiscountId,
    requestContext
  ) => {
    const selector = buildFindByIdSelector(orderDiscountId);
    const discount = await OrderDiscounts.findOne(selector);

    log(`OrderDiscounts -> Remove Discount ${orderDiscountId}`, {
      orderId: discount.orderId,
    });

    if (discount.trigger === OrderDiscountTrigger.USER) {
      // Release
      const adapter = await getAdapter(discount, requestContext);
      if (!adapter) return null;
      await adapter.release();

      await OrderDiscounts.deleteOne(selector);
      await updateCalculation(discount.orderId, requestContext);
    } else {
      await OrderDiscounts.deleteOne(selector);
      emit('ORDER_REMOVE_DISCOUNT', { discount });
    }
    return discount;
  };

  const updateDiscount: OrderDiscountsModule['update'] = async (
    orderDiscountId,
    doc,
    userId
  ) => {
    await mutations.update(orderDiscountId, doc, userId);

    const selector = buildFindByIdSelector(orderDiscountId);
    const discount = OrderDiscounts.findOne(selector);
    emit('ORDER_UPDATE_DISCOUNT', { discount });
    return discount;
  };

  const reserveDiscount = async (
    orderDiscount: OrderDiscount,
    requestContext: Context
  ) => {
    const adapter = await getAdapter(orderDiscount, requestContext);
    if (!adapter) return null;

    const reservation = await adapter.reserve({
      code: orderDiscount.code,
    });

    return await updateDiscount(
      orderDiscount._id as string,
      reservation,
      requestContext.userId
    );
  };

  const grabDiscount = async (
    { code, orderId }: OrderDiscount,
    requestContext: Context
  ) => {
    log(`OrderDiscounts -> Try to grab ${code}`, { orderId });

    const existingDiscount = OrderDiscounts.findOne({ code, orderId });
    if (existingDiscount)
      throw new Error(OrderDiscountErrorCode.CODE_ALREADY_PRESENT);

    const discount = await OrderDiscounts.findOne({ code, orderId: null });
    if (!discount) return null;

    const discountId = dbIdToString(discount._id);
    try {
      const updatedDiscount = await updateDiscount(
        discountId,
        { orderId },
        requestContext.userId
      );
      return await reserveDiscount(updatedDiscount, requestContext);
    } catch (error) {
      // Rollback
      await updateDiscount(
        discountId,
        { orderId: discount.orderId },
        requestContext.userId
      );

      throw error;
    }
  };

  return {
    // Queries
    findOrderDiscount: async ({ discountId }, options) => {
      return await OrderDiscounts.findOne(
        buildFindByIdSelector(discountId),
        options
      );
    },
    findOrderDiscounts: async ({ orderId }) => {
      const discounts = OrderDiscounts.find({ orderId });
      return await discounts.toArray();
    },

    // Transformations
    interface: async (orderDiscount, requestContext) => {
      const adapter = await getAdapter(orderDiscount, requestContext);
      return adapter
    },

    isValid: async (orderDiscount, requestContext) => {
      const adapter = await getAdapter(orderDiscount, requestContext);
      if (!adapter) return null;

      if (orderDiscount.trigger === OrderDiscountTrigger.SYSTEM) {
        return adapter.isValidForSystemTriggering();
      }

      return adapter.isValidForCodeTriggering({
        code: orderDiscount.code,
      });
    },

    // Mutations
    createManualOrderDiscount: async (doc, requestContext) => {
      const { code, orderId } = doc;
      // Try to grab single-usage-discount
      if (!code) throw new Error(OrderDiscountErrorCode.CODE_NOT_VALID);

      const fetchedDiscount = await grabDiscount(doc, requestContext);
      if (fetchedDiscount) return fetchedDiscount;

      const order = await requestContext.modules.orders.findOrder({ orderId });
      const director = OrderDiscountDirector.actions(
        { order, orderDiscount: doc },
        requestContext
      );
      const discountKey = await director.resolveDiscountKeyFromStaticCode({
        code,
      });

      if (discountKey) {
        const newDiscount = await createDiscount(doc, requestContext.userId);

        let reservedDiscount: OrderDiscount;
        reservedDiscount = await reserveDiscount(
          newDiscount,
          requestContext
        ).catch(async (error) => {
          // Rollback
          await deleteDiscount(newDiscount._id as string, requestContext);
          throw error;
        });

        await updateCalculation(orderId, requestContext);
        return reservedDiscount;
      }

      throw new Error(OrderDiscountErrorCode.CODE_NOT_VALID);
    },

    create: async (doc, userId) => {
      const discount = await createDiscount(doc, userId);

      if (discount.trigger === OrderDiscountTrigger.USER) {
        emit('ORDER_CREATE_DISCOUNT', { discount });
      }

      return discount;
    },

    delete: deleteDiscount,

    update: async (orderDiscountId, doc, userId) => {
      await mutations.update(orderDiscountId, doc, userId);

      const selector = buildFindByIdSelector(orderDiscountId);
      const discount = OrderDiscounts.findOne(selector);
      emit('ORDER_UPDATE_DISCOUNT', { discount });
      return discount;
    },
  };
};
