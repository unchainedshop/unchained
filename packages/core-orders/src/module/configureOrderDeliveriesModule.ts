import { mongodb, generateDbFilterById, generateDbObjectId } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import { Order, OrderDelivery, OrderDeliveryStatus, OrderDiscount } from '../types.js';
import {
  DeliveryPricingCalculation,
  DeliveryPricingDirector,
  DeliveryPricingSheet,
  DeliveryDirector,
  type DeliveryLocation,
  type IDeliveryPricingSheet,
} from '@unchainedshop/core-delivery';

const ORDER_DELIVERY_EVENTS: string[] = ['ORDER_DELIVER', 'ORDER_UPDATE_DELIVERY'];

export const buildFindByIdSelector = (orderDeliveryId: string) =>
  generateDbFilterById(orderDeliveryId) as mongodb.Filter<OrderDelivery>;

export const configureOrderDeliveriesModule = ({
  OrderDeliveries,
}: {
  OrderDeliveries: mongodb.Collection<OrderDelivery>;
}) => {
  registerEvents(ORDER_DELIVERY_EVENTS);

  const normalizedStatus = (orderDelivery: OrderDelivery) => {
    return orderDelivery.status === null
      ? OrderDeliveryStatus.OPEN
      : (orderDelivery.status as OrderDeliveryStatus);
  };

  const updateStatus = async (
    orderDeliveryId: string,
    { status, info }: { status: OrderDeliveryStatus; info?: string },
  ): Promise<OrderDelivery> => {
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
    findDelivery: async (
      { orderDeliveryId }: { orderDeliveryId: string },
      options?: mongodb.FindOptions,
    ): Promise<OrderDelivery> => {
      return OrderDeliveries.findOne(buildFindByIdSelector(orderDeliveryId), options);
    },

    // Transformations
    discounts: (
      orderDelivery: OrderDelivery,
      { order, orderDiscount }: { order: Order; orderDiscount: OrderDiscount },
      unchainedAPI,
    ): Array<DeliveryPricingCalculation> => {
      const { modules } = unchainedAPI;
      if (!orderDelivery) return [];

      const pricingSheet = modules.orders.deliveries.pricingSheet(orderDelivery, order.currency);

      return pricingSheet.discountPrices(orderDiscount._id).map((discount) => ({
        delivery: orderDelivery,
        ...discount,
      }));
    },

    isBlockingOrderConfirmation: async (orderDelivery: OrderDelivery, unchainedAPI) => {
      const provider = await unchainedAPI.modules.delivery.findProvider({
        deliveryProviderId: orderDelivery.deliveryProviderId,
      });

      const isAutoReleaseAllowed = await unchainedAPI.modules.delivery.isAutoReleaseAllowed(
        provider,
        unchainedAPI,
      );

      return !isAutoReleaseAllowed;
    },

    activePickUpLocation: async (
      orderDelivery: OrderDelivery,
      unchainedAPI,
    ): Promise<DeliveryLocation> => {
      const { orderPickUpLocationId } = orderDelivery.context || {};

      const provider = await unchainedAPI.modules.delivery.findProvider({
        deliveryProviderId: orderDelivery.deliveryProviderId,
      });
      const director = await DeliveryDirector.actions(
        provider,
        { orderDelivery: orderDelivery },
        unchainedAPI,
      );

      return director.pickUpLocationById(orderPickUpLocationId);
    },

    isBlockingOrderFullfillment: (orderDelivery: OrderDelivery) => {
      if (orderDelivery.status === OrderDeliveryStatus.DELIVERED) return false;
      return true;
    },

    normalizedStatus,

    pricingSheet: (orderDelivery: OrderDelivery, currency: string): IDeliveryPricingSheet => {
      return DeliveryPricingSheet({
        calculation: orderDelivery.calculation,
        currency,
      });
    },

    // Mutations

    create: async (doc: OrderDelivery): Promise<OrderDelivery> => {
      const { insertedId: orderDeliveryId } = await OrderDeliveries.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
        context: doc.context || {},
        status: null,
      });

      const orderDelivery = await OrderDeliveries.findOne(buildFindByIdSelector(orderDeliveryId));
      return orderDelivery;
    },

    delete: async (orderDeliveryId: string) => {
      const { deletedCount } = await OrderDeliveries.deleteOne({ _id: orderDeliveryId });
      return deletedCount;
    },

    markAsDelivered: async (orderDelivery: OrderDelivery) => {
      if (normalizedStatus(orderDelivery) !== OrderDeliveryStatus.OPEN) return;
      const updatedOrderDelivery = await updateStatus(orderDelivery._id, {
        status: OrderDeliveryStatus.DELIVERED,
        info: 'mark delivered manually',
      });
      await emit('ORDER_DELIVER', { orderDelivery: updatedOrderDelivery });
      return updatedOrderDelivery;
    },

    send: async (
      orderDelivery: OrderDelivery,
      { order, deliveryContext }: { order: Order; deliveryContext?: any },
      unchainedAPI,
    ): Promise<OrderDelivery> => {
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

    updateContext: async (orderDeliveryId: string, context: any): Promise<OrderDelivery> => {
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

    updateCalculation: async (
      orderDelivery: OrderDelivery,
      currency: string,
      unchainedAPI,
    ): Promise<OrderDelivery> => {
      const calculation = await DeliveryPricingDirector.rebuildCalculation(
        {
          currency,
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

export type OrderDeliveriesModule = ReturnType<typeof configureOrderDeliveriesModule>;
