import { ModuleInput } from '@unchainedshop/mongodb';
import { createRequire } from 'node:module';
import { OrderDeliveriesCollection } from '../db/OrderDeliveriesCollection.js';
import { OrderDiscountsCollection } from '../db/OrderDiscountsCollection.js';
import { OrderPaymentsCollection } from '../db/OrderPaymentsCollection.js';
import { OrderPositionsCollection } from '../db/OrderPositionsCollection.js';
import { OrdersCollection } from '../db/OrdersCollection.js';
import { ordersSettings, OrdersSettingsOptions } from '../orders-settings.js';
import {
  configureOrderDeliveriesModule,
  OrderDeliveriesModule,
} from './configureOrderDeliveriesModule.js';
import { configureOrderDiscountsModule, OrderDiscountsModule } from './configureOrderDiscountsModule.js';
import { configureOrderPaymentsModule, OrderPaymentsModule } from './configureOrderPaymentsModule.js';
import { configureOrderPositionsModule, OrderPositionsModule } from './configureOrderPositionsModule.js';
import { configureOrderModuleMutations, OrderMutations } from './configureOrdersModule-mutations.js';
import { configureOrderModuleProcessing, OrderProcessing } from './configureOrdersModule-processing.js';
import { configureOrdersModuleQueries, OrderQueries } from './configureOrdersModule-queries.js';
import {
  configureOrderModuleTransformations,
  OrderTransformations,
} from './configureOrdersModule-transformations.js';
import { emit } from '@unchainedshop/events';
import { Order } from '../types.js';

export type OrdersModule = OrderQueries &
  OrderTransformations &
  OrderProcessing &
  OrderMutations & {
    deliveries: OrderDeliveriesModule;
    discounts: OrderDiscountsModule;
    positions: OrderPositionsModule;
    payments: OrderPaymentsModule;

    setDeliveryProvider: (orderId: string, deliveryProviderId: string) => Promise<Order>;
    setPaymentProvider: (orderId: string, paymentProviderId: string) => Promise<Order>;
  };

const require = createRequire(import.meta.url);
const { Locker, MongoAdapter } = require('@kontsedal/locco');

export const configureOrdersModule = async ({
  db,
  options: orderOptions = {},
}: ModuleInput<OrdersSettingsOptions>): Promise<OrdersModule> => {
  ordersSettings.configureSettings(orderOptions);

  const Orders = await OrdersCollection(db);
  const OrderDeliveries = await OrderDeliveriesCollection(db);
  const OrderDiscounts = await OrderDiscountsCollection(db);
  const OrderPayments = await OrderPaymentsCollection(db);
  const OrderPositions = await OrderPositionsCollection(db);

  const mongoAdapter = new MongoAdapter({
    client: {
      db: () => db,
    },
  });
  const locker = new Locker({
    adapter: mongoAdapter,
    retrySettings: { retryDelay: 200, retryTimes: 10 },
  });

  const orderQueries = configureOrdersModuleQueries({ Orders });
  const orderTransformations = configureOrderModuleTransformations({
    Orders,
  });
  const orderProcessing = configureOrderModuleProcessing({
    Orders,
    OrderDeliveries,
    OrderPayments,
    OrderPositions,
    locker,
  });
  const orderMutations = configureOrderModuleMutations({
    Orders,
    OrderPositions,
  });

  const orderDiscountsModule = configureOrderDiscountsModule({
    OrderDiscounts,
  });

  const orderPositionsModule = configureOrderPositionsModule({
    OrderPositions,
  });

  const orderPaymentsModule = configureOrderPaymentsModule({
    OrderPayments,
  });

  const orderDeliveriesModule = configureOrderDeliveriesModule({
    OrderDeliveries,
  });

  return {
    ...orderQueries,
    ...orderTransformations,
    ...orderProcessing,
    ...orderMutations,

    // Subentities
    deliveries: orderDeliveriesModule,
    discounts: orderDiscountsModule,
    positions: orderPositionsModule,
    payments: orderPaymentsModule,

    setDeliveryProvider: async (orderId, deliveryProviderId) => {
      const delivery = await OrderDeliveries.findOne({
        orderId,
        deliveryProviderId,
      });
      const deliveryId =
        delivery?._id ||
        (
          await orderDeliveriesModule.create({
            calculation: [],
            deliveryProviderId,
            log: [],
            orderId,
            status: null,
          })
        )._id;

      const order = await Orders.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            deliveryId,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_SET_DELIVERY_PROVIDER', {
        order,
        deliveryProviderId,
      });

      return order;
    },

    setPaymentProvider: async (orderId, paymentProviderId) => {
      const payment = await OrderPayments.findOne({
        orderId,
        paymentProviderId,
      });

      const paymentId =
        payment?._id ||
        (
          await orderPaymentsModule.create({
            calculation: [],
            paymentProviderId,
            log: [],
            orderId,
            status: null,
          })
        )._id;
      const order = await Orders.findOneAndUpdate(
        { _id: orderId },
        {
          $set: { paymentId, updated: new Date() },
        },
        { returnDocument: 'after' },
      );

      await emit('ORDER_SET_PAYMENT_PROVIDER', {
        order,
        paymentProviderId,
      });

      return order;
    },
  };
};
