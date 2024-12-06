import { generateDbFilterById, ModuleInput, mongodb } from '@unchainedshop/mongodb';
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
import { configureOrdersModuleQueries, OrderQueries } from './configureOrdersModule-queries.js';
import {
  configureOrderModuleTransformations,
  OrderTransformations,
} from './configureOrdersModule-transformations.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { Order, OrderStatus } from '../types.js';

export type OrdersModule = OrderQueries &
  OrderTransformations &
  OrderMutations & {
    deliveries: OrderDeliveriesModule;
    discounts: OrderDiscountsModule;
    positions: OrderPositionsModule;
    payments: OrderPaymentsModule;

    updateStatus: (orderId: string, params: { status: OrderStatus; info?: string }) => Promise<Order>;
    acquireLock: (
      orderId: string,
      identifier: string,
      timeout?: number,
    ) => Promise<{ release: () => void }>;
    setDeliveryProvider: (orderId: string, deliveryProviderId: string) => Promise<Order>;
    setPaymentProvider: (orderId: string, paymentProviderId: string) => Promise<Order>;
  };

const require = createRequire(import.meta.url);
const { Locker, MongoAdapter } = require('@kontsedal/locco');

const ORDER_EVENTS: string[] = [
  'ORDER_CHECKOUT',
  'ORDER_CONFIRMED',
  'ORDER_REJECTED',
  'ORDER_FULLFILLED',
];

export const configureOrdersModule = async ({
  db,
  options: orderOptions = {},
}: ModuleInput<OrdersSettingsOptions>): Promise<OrdersModule> => {
  registerEvents(ORDER_EVENTS);

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
  const orderTransformations = configureOrderModuleTransformations();

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

  const findNewOrderNumber = async (order: Order, index = 0) => {
    const newHashID = ordersSettings.orderNumberHashFn(order, index);
    if ((await Orders.countDocuments({ orderNumber: newHashID }, { limit: 1 })) === 0) {
      return newHashID;
    }
    return findNewOrderNumber(order, index + 1);
  };

  return {
    ...orderQueries,
    ...orderTransformations,
    ...orderMutations,

    // Subentities
    deliveries: orderDeliveriesModule,
    discounts: orderDiscountsModule,
    positions: orderPositionsModule,
    payments: orderPaymentsModule,

    updateStatus: async (orderId, { status, info }) => {
      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOne(selector, {});

      if (order.status === status) return order;

      const date = new Date();
      const $set: Partial<Order> = {
        status,
        updated: new Date(),
      };
      switch (status) {
        // explicitly use fallthrough here!
        case OrderStatus.FULLFILLED:
          $set.fullfilled = order.fullfilled || date;
        case OrderStatus.REJECTED: // eslint-disable-line no-fallthrough
        case OrderStatus.CONFIRMED: // eslint-disable-line no-fallthrough
          if (status === OrderStatus.REJECTED) {
            $set.rejected = order.rejected || date;
          } else {
            $set.confirmed = order.confirmed || date;
          }
        case OrderStatus.PENDING: // eslint-disable-line no-fallthrough
          $set.ordered = order.ordered || date;
          $set.orderNumber = order.orderNumber || (await findNewOrderNumber(order));
          break;
        default:
          break;
      }

      const modifier: mongodb.UpdateFilter<Order> = {
        $set,
        $push: {
          log: {
            date,
            status,
            info,
          },
        },
      };

      const modificationResult = await Orders.findOneAndUpdate(
        {
          ...selector,
          status: { $ne: status }, // Only update if status is different
        },
        modifier,
        {
          returnDocument: 'after',
          includeResultMetadata: true,
        },
      );

      if (modificationResult.ok) {
        if (order.status === null) {
          // The first time that an order transitions away from cart is a checkout event
          await emit('ORDER_CHECKOUT', { order: modificationResult.value, oldStatus: order.status });
        }
        switch (status) {
          case OrderStatus.FULLFILLED:
            await emit('ORDER_FULLFILLED', { order: modificationResult.value, oldStatus: order.status });
            break;
          case OrderStatus.REJECTED:
            await emit('ORDER_REJECTED', { order: modificationResult.value, oldStatus: order.status });
            break;
          case OrderStatus.CONFIRMED:
            await emit('ORDER_CONFIRMED', { order: modificationResult.value, oldStatus: order.status });
            break;
          default:
            break;
        }
      }

      return modificationResult.value || Orders.findOne(selector, {});
    },

    acquireLock: async (orderId: string, identifier: string, timeout = 5000) => {
      return await locker.lock(`order:${identifier}:${orderId}`, timeout).acquire();
    },

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
