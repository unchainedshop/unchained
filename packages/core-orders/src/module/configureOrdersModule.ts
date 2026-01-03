import { eq, ne, and, isNull, isNotNull, type DrizzleDb } from '@unchainedshop/store';
import { emit, registerEvents } from '@unchainedshop/events';
import { ordersSettings, type OrdersSettingsOptions } from '../orders-settings.ts';
import { configureOrderDeliveriesModule } from './configureOrderDeliveriesModule.ts';
import { configureOrderDiscountsModule } from './configureOrderDiscountsModule.ts';
import { configureOrderPaymentsModule } from './configureOrderPaymentsModule.ts';
import { configureOrderPositionsModule } from './configureOrderPositionsModule.ts';
import { configureOrderModuleMutations } from './configureOrdersModule-mutations.ts';
import { configureOrdersModuleQueries } from './configureOrdersModule-queries.ts';
import {
  orders,
  orderDeliveries,
  orderPayments,
  OrderStatus,
  rowToOrder,
  type Order,
  type OrderLogEntry,
} from '../db/schema.ts';

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
  options: orderOptions = {},
}: {
  db: DrizzleDb;
  options?: OrdersSettingsOptions;
}) => {
  registerEvents(ORDER_EVENTS);

  ordersSettings.configureSettings(orderOptions);

  const orderQueries = configureOrdersModuleQueries({ db });

  const orderMutations = configureOrderModuleMutations({ db });

  const orderDiscountsModule = configureOrderDiscountsModule({ db });

  const orderPositionsModule = configureOrderPositionsModule({ db });

  const orderPaymentsModule = configureOrderPaymentsModule({ db });

  const orderDeliveriesModule = configureOrderDeliveriesModule({ db });

  const findNewOrderNumber = async (order: Order, index = 0) => {
    const newHashID = ordersSettings.orderNumberHashFn(order, index);

    // Check if order number already exists
    const [existing] = await db
      .select({ _id: orders._id })
      .from(orders)
      .where(eq(orders.orderNumber, newHashID))
      .limit(1);

    if (!existing) {
      return newHashID;
    }
    return findNewOrderNumber(order, index + 1);
  };

  // Simple in-memory lock for single-instance deployments
  // For distributed deployments, consider using a Redis-based lock
  const locks = new Map<string, { resolve: () => void; promise: Promise<void> }>();

  const acquireLock = async (orderId: string, identifier: string, timeout = 5000) => {
    const lockKey = `order:${identifier}:${orderId}`;

    // Wait for existing lock if any
    const existingLock = locks.get(lockKey);
    if (existingLock) {
      await Promise.race([existingLock.promise, new Promise((resolve) => setTimeout(resolve, timeout))]);
    }

    // Create new lock
    let resolveLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    locks.set(lockKey, { resolve: resolveLock!, promise: lockPromise });

    // Auto-release after timeout
    const timeoutId = setTimeout(() => {
      const lock = locks.get(lockKey);
      if (lock?.promise === lockPromise) {
        lock.resolve();
        locks.delete(lockKey);
      }
    }, timeout);

    return {
      release: () => {
        clearTimeout(timeoutId);
        const lock = locks.get(lockKey);
        if (lock?.promise === lockPromise) {
          lock.resolve();
          locks.delete(lockKey);
        }
      },
    };
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
      { status, info }: { status: (typeof OrderStatus)[keyof typeof OrderStatus] | null; info?: string },
    ) => {
      const [orderRow] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!orderRow) return null;
      if (orderRow.status === status) return rowToOrder(orderRow);

      const order = rowToOrder(orderRow);

      const date = new Date();
      const updates: Partial<Order> = {
        status,
        updated: date,
      };

      switch (status) {
        // explicitly use fallthrough here!
        case OrderStatus.FULFILLED:
          updates.fulfilled = order.fulfilled || date;
        case OrderStatus.REJECTED: // eslint-disable-line no-fallthrough
        case OrderStatus.CONFIRMED:
          if (status === OrderStatus.REJECTED) {
            updates.rejected = order.rejected || date;
          } else {
            updates.confirmed = order.confirmed || date;
          }
        case OrderStatus.PENDING: // eslint-disable-line no-fallthrough
          updates.ordered = order.ordered || date;
          updates.orderNumber = order.orderNumber || (await findNewOrderNumber(order));
          break;
        default:
          break;
      }

      // Update log
      const logEntry: OrderLogEntry = { date, status: status ?? undefined, info };
      const log: OrderLogEntry[] = [...(order.log || []), logEntry];

      // Update only if status is different
      // Use sql for ne comparison since status can be null
      await db
        .update(orders)
        .set({ ...updates, log })
        .where(
          and(
            eq(orders._id, orderId),
            status === null
              ? isNotNull(orders.status)
              : order.status === null
                ? isNull(orders.status)
                : ne(orders.status, status),
          ),
        );

      const [modifiedOrderRow] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (modifiedOrderRow) {
        const modifiedOrder = rowToOrder(modifiedOrderRow);
        if (order.status === null) {
          // The first time that an order transitions away from cart is a checkout event
          await emit('ORDER_CHECKOUT', { order: modifiedOrder, oldStatus: order.status });
        }
        switch (status) {
          case OrderStatus.FULFILLED:
            await emit('ORDER_FULFILLED', { order: modifiedOrder, oldStatus: order.status });
            break;
          case OrderStatus.REJECTED:
            await emit('ORDER_REJECTED', { order: modifiedOrder, oldStatus: order.status });
            break;
          case OrderStatus.CONFIRMED:
            await emit('ORDER_CONFIRMED', { order: modifiedOrder, oldStatus: order.status });
            break;
          default:
            break;
        }
        return modifiedOrder;
      }

      return order;
    },

    acquireLock,

    setDeliveryProvider: async (orderId: string, deliveryProviderId: string) => {
      // Find existing delivery with this provider
      const [existingDelivery] = await db
        .select()
        .from(orderDeliveries)
        .where(
          and(
            eq(orderDeliveries.orderId, orderId),
            eq(orderDeliveries.deliveryProviderId, deliveryProviderId),
          ),
        )
        .limit(1);

      const deliveryId =
        existingDelivery?._id ||
        (
          await orderDeliveriesModule.create({
            orderId,
            deliveryProviderId,
          })
        )._id;

      // Update order only if deliveryId is different
      const [currentRow] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!currentRow) return null;
      if (currentRow.deliveryId === deliveryId) return rowToOrder(currentRow);

      await db.update(orders).set({ deliveryId, updated: new Date() }).where(eq(orders._id, orderId));

      const [orderRow] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      const resultOrder = rowToOrder(orderRow);
      await emit('ORDER_SET_DELIVERY_PROVIDER', {
        order: resultOrder,
        deliveryProviderId,
      });

      return resultOrder;
    },

    setPaymentProvider: async (orderId: string, paymentProviderId: string) => {
      // Find existing payment with this provider
      const [existingPayment] = await db
        .select()
        .from(orderPayments)
        .where(
          and(
            eq(orderPayments.orderId, orderId),
            eq(orderPayments.paymentProviderId, paymentProviderId),
          ),
        )
        .limit(1);

      const paymentId =
        existingPayment?._id ||
        (
          await orderPaymentsModule.create({
            orderId,
            paymentProviderId,
          })
        )._id;

      // Update order only if paymentId is different
      const [currentRow] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!currentRow) return null;
      if (currentRow.paymentId === paymentId) return rowToOrder(currentRow);

      await db.update(orders).set({ paymentId, updated: new Date() }).where(eq(orders._id, orderId));

      const [orderRow] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      const resultOrder = rowToOrder(orderRow);
      await emit('ORDER_SET_PAYMENT_PROVIDER', {
        order: resultOrder,
        paymentProviderId,
      });

      return resultOrder;
    },
  };
};

export type OrdersModule = Awaited<ReturnType<typeof configureOrdersModule>>;
