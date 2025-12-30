import { emit, registerEvents } from '@unchainedshop/events';
import { eq, inArray, type DrizzleDb, generateId, buildSelectColumns } from '@unchainedshop/store';
import type { PricingCalculation } from '@unchainedshop/utils';
import {
  orderPayments,
  OrderPaymentStatus,
  rowToOrderPayment,
  type OrderPayment,
  type OrderPaymentRow,
  type OrderLogEntry,
} from '../db/schema.ts';

type SelectOrderPayment = OrderPayment | Partial<OrderPayment>;

// Column mapping for field selection
const PAYMENT_COLUMNS = {
  _id: orderPayments._id,
  orderId: orderPayments.orderId,
  paymentProviderId: orderPayments.paymentProviderId,
  status: orderPayments.status,
  transactionId: orderPayments.transactionId,
  paid: orderPayments.paid,
  calculation: orderPayments.calculation,
  context: orderPayments.context,
  log: orderPayments.log,
  created: orderPayments.created,
  updated: orderPayments.updated,
} as const;

export type OrderPaymentFields = keyof typeof PAYMENT_COLUMNS;

export interface OrderPaymentQueryOptions {
  fields?: OrderPaymentFields[];
}

const ORDER_PAYMENT_EVENTS: string[] = ['ORDER_UPDATE_PAYMENT', 'ORDER_SIGN_PAYMENT', 'ORDER_PAY'];

export const configureOrderPaymentsModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(ORDER_PAYMENT_EVENTS);

  const normalizedStatus = (orderPayment: OrderPayment) => {
    return orderPayment.status === null
      ? OrderPaymentStatus.OPEN
      : (orderPayment.status as (typeof OrderPaymentStatus)[keyof typeof OrderPaymentStatus]);
  };

  const updateStatus = async (
    orderPaymentId: string,
    {
      transactionId,
      status,
      info,
    }: {
      transactionId?: string;
      status: (typeof OrderPaymentStatus)[keyof typeof OrderPaymentStatus];
      info?: string;
    },
  ) => {
    const date = new Date();
    const updates: Partial<OrderPayment> = {
      status,
      updated: date,
    };

    if (transactionId) {
      updates.transactionId = transactionId;
    }
    if (status === OrderPaymentStatus.PAID) {
      updates.paid = date;
    }

    // Get current payment to update log
    const [current] = await db
      .select()
      .from(orderPayments)
      .where(eq(orderPayments._id, orderPaymentId))
      .limit(1);

    if (!current) return null;

    const logEntry: OrderLogEntry = { date, status, info };
    const log: OrderLogEntry[] = [...(current.log || []), logEntry];

    await db
      .update(orderPayments)
      .set({ ...updates, log })
      .where(eq(orderPayments._id, orderPaymentId));

    const [updated] = await db
      .select()
      .from(orderPayments)
      .where(eq(orderPayments._id, orderPaymentId))
      .limit(1);

    return updated ? rowToOrderPayment(updated) : null;
  };

  return {
    // Queries
    findOrderPayment: async (
      { orderPaymentId }: { orderPaymentId: string },
      options?: OrderPaymentQueryOptions,
    ) => {
      if (!orderPaymentId) return null;

      const selectColumns = buildSelectColumns(PAYMENT_COLUMNS, options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(orderPayments)
        : db.select().from(orderPayments);

      const [payment] = await baseQuery.where(eq(orderPayments._id, orderPaymentId)).limit(1);
      return payment
        ? selectColumns
          ? (payment as SelectOrderPayment as OrderPayment)
          : rowToOrderPayment(payment as OrderPaymentRow)
        : null;
    },

    findOrderPaymentsByProviderIds: async ({
      paymentProviderIds,
    }: {
      paymentProviderIds: string[];
    }): Promise<OrderPayment[]> => {
      if (!paymentProviderIds?.length) return [];
      const rows = await db
        .select()
        .from(orderPayments)
        .where(inArray(orderPayments.paymentProviderId, paymentProviderIds));
      return rows.map(rowToOrderPayment);
    },

    findOrderPaymentByTransactionId: async (transactionId: string) => {
      const [payment] = await db
        .select()
        .from(orderPayments)
        .where(eq(orderPayments.transactionId, transactionId))
        .limit(1);
      return payment ? rowToOrderPayment(payment) : null;
    },

    normalizedStatus,

    // Mutations

    create: async (
      doc: Pick<OrderPayment, 'orderId' | 'paymentProviderId'> &
        Partial<Omit<OrderPayment, 'orderId' | 'paymentProviderId'>>,
    ): Promise<OrderPayment> => {
      const orderPaymentId = doc._id || generateId();
      const now = new Date();

      await db.insert(orderPayments).values({
        _id: orderPaymentId,
        created: now,
        orderId: doc.orderId,
        paymentProviderId: doc.paymentProviderId,
        status: doc.status ?? null,
        calculation: doc.calculation ?? [],
        log: doc.log ?? [],
        context: doc.context ?? {},
      });

      const [orderPayment] = await db
        .select()
        .from(orderPayments)
        .where(eq(orderPayments._id, orderPaymentId))
        .limit(1);

      return rowToOrderPayment(orderPayment);
    },

    logEvent: async (orderPaymentId: string, event: any): Promise<boolean> => {
      const date = new Date();

      const [current] = await db
        .select()
        .from(orderPayments)
        .where(eq(orderPayments._id, orderPaymentId))
        .limit(1);

      if (!current) return false;

      const logEntry: OrderLogEntry = { date, info: JSON.stringify(event) };
      const log: OrderLogEntry[] = [...(current.log || []), logEntry];

      await db.update(orderPayments).set({ log }).where(eq(orderPayments._id, orderPaymentId));

      return true;
    },

    markAsPaid: async (orderPayment: OrderPayment, meta: any) => {
      if (normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) return;

      await updateStatus(orderPayment._id, {
        status: OrderPaymentStatus.PAID,
        info: meta ? JSON.stringify(meta) : 'mark paid manually',
      });
      await emit('ORDER_PAY', { orderPayment });
    },

    updateContext: async (orderPaymentId: string, context: any) => {
      const [current] = await db
        .select()
        .from(orderPayments)
        .where(eq(orderPayments._id, orderPaymentId))
        .limit(1);

      if (!current) return null;
      if (!context || Object.keys(context).length === 0) return rowToOrderPayment(current);

      const mergedContext = { ...(current.context || {}), ...context };

      await db
        .update(orderPayments)
        .set({
          context: mergedContext,
          updated: new Date(),
        })
        .where(eq(orderPayments._id, orderPaymentId));

      const [orderPayment] = await db
        .select()
        .from(orderPayments)
        .where(eq(orderPayments._id, orderPaymentId))
        .limit(1);

      const result = orderPayment ? rowToOrderPayment(orderPayment) : null;
      await emit('ORDER_UPDATE_PAYMENT', { orderPayment: result });
      return result;
    },

    updateStatus,

    updateCalculation: async <T extends PricingCalculation>(
      orderPaymentId: string,
      calculation: T[],
    ) => {
      await db
        .update(orderPayments)
        .set({
          calculation,
          updated: new Date(),
        })
        .where(eq(orderPayments._id, orderPaymentId));

      const [updated] = await db
        .select()
        .from(orderPayments)
        .where(eq(orderPayments._id, orderPaymentId))
        .limit(1);

      return updated ? rowToOrderPayment(updated) : null;
    },

    deleteOrderPayments: async (orderId: string) => {
      const result = await db.delete(orderPayments).where(eq(orderPayments.orderId, orderId));
      return result.rowsAffected;
    },
  };
};

export type OrderPaymentsModule = ReturnType<typeof configureOrderPaymentsModule>;
