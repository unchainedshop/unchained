import { emit, registerEvents } from '@unchainedshop/events';
import { eq, inArray, type DrizzleDb, generateId, buildSelectColumns } from '@unchainedshop/store';
import type { PricingCalculation } from '@unchainedshop/utils';
import {
  orderDeliveries,
  OrderDeliveryStatus,
  rowToOrderDelivery,
  type OrderDelivery,
  type OrderDeliveryRow,
  type OrderLogEntry,
} from '../db/schema.ts';

type SelectOrderDelivery = OrderDelivery | Partial<OrderDelivery>;

// Column mapping for field selection
const DELIVERY_COLUMNS = {
  _id: orderDeliveries._id,
  orderId: orderDeliveries.orderId,
  deliveryProviderId: orderDeliveries.deliveryProviderId,
  status: orderDeliveries.status,
  delivered: orderDeliveries.delivered,
  calculation: orderDeliveries.calculation,
  context: orderDeliveries.context,
  log: orderDeliveries.log,
  created: orderDeliveries.created,
  updated: orderDeliveries.updated,
} as const;

export type OrderDeliveryFields = keyof typeof DELIVERY_COLUMNS;

export interface OrderDeliveryQueryOptions {
  fields?: OrderDeliveryFields[];
}

const ORDER_DELIVERY_EVENTS: string[] = ['ORDER_DELIVER', 'ORDER_UPDATE_DELIVERY'];

export const configureOrderDeliveriesModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(ORDER_DELIVERY_EVENTS);

  const normalizedStatus = (orderDelivery: OrderDelivery) => {
    return orderDelivery.status === null
      ? OrderDeliveryStatus.OPEN
      : (orderDelivery.status as (typeof OrderDeliveryStatus)[keyof typeof OrderDeliveryStatus]);
  };

  const updateStatus = async (
    orderDeliveryId: string,
    {
      status,
      info,
    }: { status: (typeof OrderDeliveryStatus)[keyof typeof OrderDeliveryStatus]; info?: string },
  ) => {
    const date = new Date();
    const updates: Partial<OrderDelivery> = {
      status,
      updated: date,
    };

    if (status === OrderDeliveryStatus.DELIVERED) {
      updates.delivered = date;
    }

    // Get current delivery to update log
    const [current] = await db
      .select()
      .from(orderDeliveries)
      .where(eq(orderDeliveries._id, orderDeliveryId))
      .limit(1);

    if (!current) return null;

    const logEntry: OrderLogEntry = { date, status, info };
    const log: OrderLogEntry[] = [...(current.log || []), logEntry];

    await db
      .update(orderDeliveries)
      .set({ ...updates, log })
      .where(eq(orderDeliveries._id, orderDeliveryId));

    const [updated] = await db
      .select()
      .from(orderDeliveries)
      .where(eq(orderDeliveries._id, orderDeliveryId))
      .limit(1);

    return updated ? rowToOrderDelivery(updated) : null;
  };

  return {
    // Queries
    findDelivery: async (
      { orderDeliveryId }: { orderDeliveryId: string },
      options?: OrderDeliveryQueryOptions,
    ) => {
      if (!orderDeliveryId) return null;

      const selectColumns = buildSelectColumns(DELIVERY_COLUMNS, options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(orderDeliveries)
        : db.select().from(orderDeliveries);

      const [delivery] = await baseQuery.where(eq(orderDeliveries._id, orderDeliveryId)).limit(1);
      return delivery
        ? selectColumns
          ? (delivery as SelectOrderDelivery as OrderDelivery)
          : rowToOrderDelivery(delivery as OrderDeliveryRow)
        : null;
    },

    findDeliveryByProvidersId: async ({
      deliveryProviderIds,
    }: {
      deliveryProviderIds: string[];
    }): Promise<OrderDelivery[]> => {
      if (!deliveryProviderIds?.length) return [];
      const rows = await db
        .select()
        .from(orderDeliveries)
        .where(inArray(orderDeliveries.deliveryProviderId, deliveryProviderIds));
      return rows.map(rowToOrderDelivery);
    },

    normalizedStatus,

    // Mutations

    create: async (
      doc: Pick<OrderDelivery, 'orderId' | 'deliveryProviderId'> &
        Partial<Omit<OrderDelivery, 'orderId' | 'deliveryProviderId'>>,
    ) => {
      const orderDeliveryId = doc._id || generateId();
      const now = new Date();

      await db.insert(orderDeliveries).values({
        _id: orderDeliveryId,
        created: now,
        orderId: doc.orderId,
        deliveryProviderId: doc.deliveryProviderId,
        status: doc.status ?? null,
        calculation: doc.calculation ?? [],
        log: doc.log ?? [],
        context: doc.context ?? {},
      });

      const [orderDelivery] = await db
        .select()
        .from(orderDeliveries)
        .where(eq(orderDeliveries._id, orderDeliveryId))
        .limit(1);

      return rowToOrderDelivery(orderDelivery);
    },

    delete: async (orderDeliveryId: string) => {
      const result = await db.delete(orderDeliveries).where(eq(orderDeliveries._id, orderDeliveryId));
      return result.rowsAffected;
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

    updateContext: async (orderDeliveryId: string, context: any) => {
      const [current] = await db
        .select()
        .from(orderDeliveries)
        .where(eq(orderDeliveries._id, orderDeliveryId))
        .limit(1);

      if (!current) return null;
      if (!context || Object.keys(context).length === 0) return rowToOrderDelivery(current);

      const mergedContext = { ...(current.context || {}), ...context };

      await db
        .update(orderDeliveries)
        .set({
          context: mergedContext,
          updated: new Date(),
        })
        .where(eq(orderDeliveries._id, orderDeliveryId));

      const [orderDelivery] = await db
        .select()
        .from(orderDeliveries)
        .where(eq(orderDeliveries._id, orderDeliveryId))
        .limit(1);

      const result = orderDelivery ? rowToOrderDelivery(orderDelivery) : null;
      await emit('ORDER_UPDATE_DELIVERY', { orderDelivery: result });
      return result;
    },

    updateStatus,

    updateCalculation: async <T extends PricingCalculation>(
      orderDeliveryId: string,
      calculation: T[],
    ) => {
      await db
        .update(orderDeliveries)
        .set({
          calculation,
          updated: new Date(),
        })
        .where(eq(orderDeliveries._id, orderDeliveryId));

      const [updated] = await db
        .select()
        .from(orderDeliveries)
        .where(eq(orderDeliveries._id, orderDeliveryId))
        .limit(1);

      return updated ? rowToOrderDelivery(updated) : null;
    },

    deleteOrderDeliveries: async (orderId: string) => {
      const result = await db.delete(orderDeliveries).where(eq(orderDeliveries.orderId, orderId));
      return result.rowsAffected;
    },
  };
};

export type OrderDeliveriesModule = ReturnType<typeof configureOrderDeliveriesModule>;
