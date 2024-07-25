import { ModuleMutations, UnchainedCore } from '@unchainedshop/types/core.js';
import { OrderDiscount, OrderDiscountsModule } from '@unchainedshop/types/orders.discounts.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations, mongodb } from '@unchainedshop/mongodb';
import { OrderDiscountsSchema } from '../db/OrderDiscountsSchema.js';
import { OrderDiscountTrigger } from '../db/OrderDiscountTrigger.js';
import { OrderDiscountDirector } from '../director/OrderDiscountDirector.js';

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

  const mutations = generateDbMutations<OrderDiscount>(OrderDiscounts, OrderDiscountsSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<OrderDiscount>;

  const getAdapter = async (orderDiscount: OrderDiscount, unchainedAPI: UnchainedCore) => {
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
    const discountId = await mutations.create({ ...doc, trigger: normalizedTrigger });
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
    await mutations.update(orderDiscountId, {
      $set: doc,
    });

    const selector = buildFindByIdSelector(orderDiscountId);
    const discount = await OrderDiscounts.findOne(selector, {});
    await emit('ORDER_UPDATE_DISCOUNT', { discount });
    return discount;
  };

  const reserveDiscount = async (orderDiscount: OrderDiscount, unchainedAPI: UnchainedCore) => {
    const adapter = await getAdapter(orderDiscount, unchainedAPI);
    if (!adapter) return null;

    const reservation = await adapter.reserve({
      code: orderDiscount.code,
    });

    return updateDiscount(orderDiscount._id, { orderId: orderDiscount.orderId, reservation });
  };

  const grabDiscount = async (
    { code, orderId }: { code: string; orderId: string },
    unchainedAPI: UnchainedCore,
  ) => {
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
      await mutations.update(orderDiscountId, doc);

      const selector = buildFindByIdSelector(orderDiscountId);
      const discount = await OrderDiscounts.findOne(selector, {});
      await emit('ORDER_UPDATE_DISCOUNT', { discount });
      return discount;
    },
  };
};
