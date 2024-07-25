import { ModuleMutations } from '@unchainedshop/types/core.js';
import { mongodb, generateDbFilterById, generateDbMutations } from '@unchainedshop/mongodb';
import {
  OrderDeliveriesModule,
  OrderDelivery,
  OrderDeliveryStatus,
} from '@unchainedshop/types/orders.deliveries.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { OrderDeliveriesSchema } from '../db/OrderDeliveriesSchema.js';

const ORDER_DELIVERY_EVENTS: string[] = ['ORDER_DELIVER', 'ORDER_UPDATE_DELIVERY'];

export const buildFindByIdSelector = (orderDeliveryId: string) =>
  generateDbFilterById(orderDeliveryId) as mongodb.Filter<OrderDelivery>;

export const configureOrderDeliveriesModule = ({
  OrderDeliveries,
}: {
  OrderDeliveries: mongodb.Collection<OrderDelivery>;
}): OrderDeliveriesModule => {
  registerEvents(ORDER_DELIVERY_EVENTS);

  const mutations = generateDbMutations<OrderDelivery>(OrderDeliveries, OrderDeliveriesSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<OrderDelivery>;

  const normalizedStatus: OrderDeliveriesModule['normalizedStatus'] = (orderDelivery) => {
    return orderDelivery.status === null
      ? OrderDeliveryStatus.OPEN
      : (orderDelivery.status as OrderDeliveryStatus);
  };

  const updateStatus: OrderDeliveriesModule['updateStatus'] = async (
    orderDeliveryId,
    { status, info },
  ) => {
    const date = new Date();
    const modifier: mongodb.UpdateFilter<OrderDelivery> = {
      $set: { status, updated: new Date() },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };
    if (status === OrderDeliveryStatus.DELIVERED) {
      // eslint-disable-next-line
      // @ts-ignore
      modifier.$set.delivered = date;
    }

    const selector = buildFindByIdSelector(orderDeliveryId);
    return OrderDeliveries.findOneAndUpdate(selector, modifier, { returnDocument: 'after' });
  };

  return {
    // Queries
    findDelivery: async ({ orderDeliveryId }, options) => {
      return OrderDeliveries.findOne(buildFindByIdSelector(orderDeliveryId), options);
    },

    // Transformations
    discounts: (orderDelivery, { order, orderDiscount }, context) => {
      const { modules } = context;
      if (!orderDelivery) return [];

      const pricingSheet = modules.orders.deliveries.pricingSheet(
        orderDelivery,
        order.currency,
        context,
      );

      return pricingSheet.discountPrices(orderDiscount._id).map((discount) => ({
        delivery: orderDelivery,
        ...discount,
      }));
    },

    isBlockingOrderConfirmation: async (orderDelivery, unchainedAPI) => {
      const provider = await unchainedAPI.modules.delivery.findProvider({
        deliveryProviderId: orderDelivery.deliveryProviderId,
      });

      const isAutoReleaseAllowed = await unchainedAPI.modules.delivery.isAutoReleaseAllowed(
        provider,
        unchainedAPI,
      );

      return !isAutoReleaseAllowed;
    },
    isBlockingOrderFullfillment: (orderDelivery) => {
      if (orderDelivery.status === OrderDeliveryStatus.DELIVERED) return false;
      return true;
    },

    normalizedStatus,

    pricingSheet: (orderDelivery, currency, { modules }) => {
      return modules.delivery.pricingSheet({
        calculation: orderDelivery.calculation,
        currency,
      });
    },

    // Mutations

    create: async (doc) => {
      const orderDeliveryId = await mutations.create({
        ...doc,
        context: doc.context || {},
        status: null,
      });

      const orderDelivery = await OrderDeliveries.findOne(buildFindByIdSelector(orderDeliveryId));
      return orderDelivery;
    },

    delete: async (orderDeliveryId) => {
      const deletedCount = await mutations.delete(orderDeliveryId);
      return deletedCount;
    },

    markAsDelivered: async (orderDelivery) => {
      if (normalizedStatus(orderDelivery) !== OrderDeliveryStatus.OPEN) return;
      const updatedOrderDelivery = await updateStatus(orderDelivery._id, {
        status: OrderDeliveryStatus.DELIVERED,
        info: 'mark delivered manually',
      });
      await emit('ORDER_DELIVER', { orderDelivery: updatedOrderDelivery });
    },

    send: async (orderDelivery, { order, deliveryContext }, unchainedAPI) => {
      if (normalizedStatus(orderDelivery) !== OrderDeliveryStatus.OPEN) return orderDelivery;

      const deliveryProvider = await unchainedAPI.modules.delivery.findProvider({
        deliveryProviderId: orderDelivery.deliveryProviderId,
      });

      const deliveryProviderId = deliveryProvider._id;

      const address = orderDelivery.context?.address || order || order.billingAddress;

      const arbitraryResponseData = await unchainedAPI.modules.delivery.send(
        deliveryProviderId,
        {
          order,
          orderDelivery,
          transactionContext: {
            ...(deliveryContext || {}),
            ...(orderDelivery.context || {}),
            ...(address || {}),
          },
        },
        unchainedAPI,
      );

      if (arbitraryResponseData) {
        return updateStatus(orderDelivery._id, {
          status: OrderDeliveryStatus.DELIVERED,
          info: JSON.stringify(arbitraryResponseData),
        });
      }

      return orderDelivery;
    },

    updateContext: async (orderDeliveryId, context) => {
      const selector = buildFindByIdSelector(orderDeliveryId);
      if (!context || Object.keys(context).length === 0) return OrderDeliveries.findOne(selector, {});
      const contextSetters = Object.fromEntries(
        Object.entries(context).map(([key, value]) => [`context.${key}`, value]),
      );

      const result = await OrderDeliveries.findOneAndUpdate(
        selector,
        {
          $set: {
            ...contextSetters,
            updated: new Date(),
          },
        },
        { includeResultMetadata: true, returnDocument: 'after' },
      );

      if (result.ok) {
        await emit('ORDER_UPDATE_DELIVERY', {
          orderDelivery: result.value,
        });
        return result.value;
      }

      return null;
    },

    updateStatus,

    updateCalculation: async (orderDelivery, unchainedAPI) => {
      const calculation = await unchainedAPI.modules.delivery.calculate(
        {
          item: orderDelivery,
        },
        unchainedAPI,
      );

      return OrderDeliveries.findOneAndUpdate(
        buildFindByIdSelector(orderDelivery._id),
        {
          $set: {
            calculation,
            updated: new Date(),
          },
        },
        {
          returnDocument: 'after',
        },
      );
    },
  };
};
