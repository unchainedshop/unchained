import { Context } from '@unchainedshop/types/api';
import { Collection, Filter, ModuleMutations } from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import { OrderDiscount, OrderDiscountsModule } from '@unchainedshop/types/orders.discounts';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { OrderDiscountsSchema } from '../db/OrderDiscountsSchema';
import { OrderDiscountTrigger } from '../db/OrderDiscountTrigger';
import { OrderDiscountDirector } from '../director/OrderDiscountDirector';

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

  const mutations = generateDbMutations<OrderDiscount>(OrderDiscounts, OrderDiscountsSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<OrderDiscount>;

  const getAdapter = async (orderDiscount: OrderDiscount, requestContext: Context) => {
    const order = await requestContext.modules.orders.findOrder({
      orderId: orderDiscount.orderId,
    });
    const Adapter = OrderDiscountDirector.getAdapter(orderDiscount.discountKey);
    if (!Adapter) return null;
    const adapter = Adapter.actions({
      context: { order, orderDiscount, ...requestContext },
    });
    return adapter;
  };

  const createDiscount: OrderDiscountsModule['create'] = async (doc, userId) => {
    const normalizedTrigger = doc.trigger || OrderDiscountTrigger.USER;

    log(`Create Order Discount: ${doc.discountKey} with trigger ${normalizedTrigger}`, {
      orderId: doc.orderId,
    });

    const discountId = await mutations.create({ ...doc, trigger: normalizedTrigger }, userId);
    const discount = await OrderDiscounts.findOne(buildFindByIdSelector(discountId));
    return discount;
  };

  const deleteDiscount: OrderDiscountsModule['delete'] = async (orderDiscountId, requestContext) => {
    const selector = buildFindByIdSelector(orderDiscountId);
    const discount = await OrderDiscounts.findOne(selector, {});

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

  const updateDiscount: OrderDiscountsModule['update'] = async (orderDiscountId, doc, userId) => {
    await mutations.update(orderDiscountId, doc, userId);

    const selector = buildFindByIdSelector(orderDiscountId);
    const discount = await OrderDiscounts.findOne(selector, {});
    emit('ORDER_UPDATE_DISCOUNT', { discount });
    return discount;
  };

  const reserveDiscount = async (orderDiscount: OrderDiscount, requestContext: Context) => {
    const adapter = await getAdapter(orderDiscount, requestContext);
    if (!adapter) return null;

    const reservation = await adapter.reserve({
      code: orderDiscount.code,
    });

    return updateDiscount(
      orderDiscount._id,
      { orderId: orderDiscount.orderId, reservation },
      requestContext.userId,
    );
  };

  const grabDiscount = async ({ code, orderId }: OrderDiscount, requestContext: Context) => {
    log(`OrderDiscounts -> Try to grab ${code}`, { orderId });

    const existingDiscount = await OrderDiscounts.findOne({ code, orderId });

    if (existingDiscount) throw new Error(OrderDiscountErrorCode.CODE_ALREADY_PRESENT);

    const discount = await OrderDiscounts.findOne({ code, orderId: null });
    if (!discount) return null;

    const discountId = discount._id;
    try {
      const updatedDiscount = await updateDiscount(discountId, { orderId }, requestContext.userId);
      return reserveDiscount(updatedDiscount, requestContext);
    } catch (error) {
      // Rollback
      await updateDiscount(discountId, { orderId: discount.orderId }, requestContext.userId);

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
    interface: async (orderDiscount, requestContext) => {
      const adapter = await getAdapter(orderDiscount, requestContext);
      return adapter;
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

    // Adapter
    configurationForPricingAdapterKey: async (
      orderDiscount,
      adapterKey,
      calculationSheet,
      requestContext,
    ) => {
      const adapter = await getAdapter(orderDiscount, requestContext);
      if (!adapter) return null;

      return adapter.discountForPricingAdapterKey({
        pricingAdapterKey: adapterKey,
        calculationSheet,
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
      const director = await OrderDiscountDirector.actions(
        { order, orderDiscount: doc },
        requestContext,
      );
      const discountKey = await director.resolveDiscountKeyFromStaticCode({
        code,
      });

      if (discountKey) {
        const newDiscount = await createDiscount(
          {
            ...doc,
            discountKey,
          },
          requestContext.userId,
        );

        const reservedDiscount = await reserveDiscount(newDiscount, requestContext).catch(
          async (error) => {
            // Rollback
            await deleteDiscount(newDiscount._id, requestContext);
            throw error;
          },
        );

        await updateCalculation(orderId, requestContext);

        emit('ORDER_ADD_DISCOUNT', { discount: reserveDiscount });

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
      const discount = await OrderDiscounts.findOne(selector, {});
      emit('ORDER_UPDATE_DISCOUNT', { discount });
      return discount;
    },
  };
};
