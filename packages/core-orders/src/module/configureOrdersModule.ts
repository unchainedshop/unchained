import { generateDbFilterById, type ModuleInput, mongodb } from '@unchainedshop/mongodb';
import { createRequire } from 'node:module';
import { OrderDeliveriesCollection } from '../db/OrderDeliveriesCollection.ts';
import { OrderDiscountsCollection } from '../db/OrderDiscountsCollection.ts';
import { OrderPaymentsCollection } from '../db/OrderPaymentsCollection.ts';
import { OrderPositionsCollection } from '../db/OrderPositionsCollection.ts';
import { OrdersCollection, type Order, OrderStatus } from '../db/OrdersCollection.ts';
import { ordersSettings, type OrdersSettingsOptions } from '../orders-settings.ts';
import { configureOrderDeliveriesModule } from './configureOrderDeliveriesModule.ts';
import { configureOrderDiscountsModule } from './configureOrderDiscountsModule.ts';
import { configureOrderPaymentsModule } from './configureOrderPaymentsModule.ts';
import { configureOrderPositionsModule } from './configureOrderPositionsModule.ts';
import { configureOrderModuleMutations } from './configureOrdersModule-mutations.ts';
import { configureOrdersModuleQueries } from './configureOrdersModule-queries.ts';
import { emit, registerEvents } from '@unchainedshop/events';

import renameCurrencyCode from '../migrations/20250502111800-currency-code.ts';

// @kontsedal/locco uses a deprecated way of importing files in ESM (node16 behavior)
const require = createRequire(import.meta.url);
const { Locker, MongoAdapter } = require('@kontsedal/locco');

// NOTE: Renamed from ORDER_FULLFILLED to ORDER_FULFILLED in v5.0.0
// This is a breaking change for event subscribers
const ORDER_EVENTS: string[] = [
  'ORDER_CHECKOUT',
  'ORDER_CONFIRMED',
  'ORDER_REJECTED',
  'ORDER_FULFILLED',
];

export const configureOrdersModule = async ({
  db,
  migrationRepository,
  options: orderOptions = {},
}: ModuleInput<OrdersSettingsOptions>) => {
  // Migration v3 -> v4
  renameCurrencyCode(migrationRepository);

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
    ...orderMutations,

    // Subentities
    deliveries: orderDeliveriesModule,
    discounts: orderDiscountsModule,
    positions: orderPositionsModule,
    payments: orderPaymentsModule,

    updateStatus: async (
      orderId: string,
      { status, info }: { status: OrderStatus | null; info?: string },
    ) => {
      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOne(selector, {});

      if (!order) return null;
      if (order.status === status) return order;

      const date = new Date();
      const $set: Partial<Order> = {
        status,
        updated: new Date(),
      };
      switch (status) {
        // explicitly use fallthrough here!
        case OrderStatus.FULFILLED:
          $set.fulfilled = order.fulfilled || date;
        case OrderStatus.REJECTED: // eslint-disable-line no-fallthrough
        case OrderStatus.CONFIRMED:
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
          case OrderStatus.FULFILLED:
            await emit('ORDER_FULFILLED', { order: modificationResult.value, oldStatus: order.status });
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

    setDeliveryProvider: async (orderId: string, deliveryProviderId: string) => {
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
        { _id: orderId, deliveryId: { $ne: deliveryId } },
        {
          $set: {
            deliveryId,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      if (!order) return null;
      await emit('ORDER_SET_DELIVERY_PROVIDER', {
        order,
        deliveryProviderId,
      });

      return order;
    },

    setPaymentProvider: async (orderId: string, paymentProviderId: string) => {
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
        { _id: orderId, paymentId: { $ne: paymentId } },
        {
          $set: { paymentId, updated: new Date() },
        },
        { returnDocument: 'after' },
      );

      if (!order) return null;
      await emit('ORDER_SET_PAYMENT_PROVIDER', {
        order,
        paymentProviderId,
      });

      return order;
    },
  };
};

export type OrdersModule = Awaited<ReturnType<typeof configureOrdersModule>>;
