import { emit, registerEvents } from '@unchainedshop/events';
import { eq, isNull, and, type DrizzleDb, generateId, buildSelectColumns } from '@unchainedshop/store';
import {
  orderDiscounts,
  OrderDiscountTrigger,
  rowToOrderDiscount,
  type OrderDiscount,
  type OrderDiscountRow,
} from '../db/schema.ts';

type SelectOrderDiscount = OrderDiscount | Partial<OrderDiscount>;

// Column mapping for field selection
const DISCOUNT_COLUMNS = {
  _id: orderDiscounts._id,
  orderId: orderDiscounts.orderId,
  code: orderDiscounts.code,
  discountKey: orderDiscounts.discountKey,
  trigger: orderDiscounts.trigger,
  total: orderDiscounts.total,
  reservation: orderDiscounts.reservation,
  context: orderDiscounts.context,
  created: orderDiscounts.created,
  updated: orderDiscounts.updated,
} as const;

export type OrderDiscountFields = keyof typeof DISCOUNT_COLUMNS;

export interface OrderDiscountQueryOptions {
  fields?: OrderDiscountFields[];
}

const ORDER_DISCOUNT_EVENTS: string[] = [
  'ORDER_CREATE_DISCOUNT',
  'ORDER_UPDATE_DISCOUNT',
  'ORDER_REMOVE_DISCOUNT',
];

export const configureOrderDiscountsModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(ORDER_DISCOUNT_EVENTS);

  return {
    // Queries
    findOrderDiscount: async (
      { discountId }: { discountId: string },
      options?: OrderDiscountQueryOptions,
    ) => {
      const selectColumns = buildSelectColumns(DISCOUNT_COLUMNS, options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(orderDiscounts)
        : db.select().from(orderDiscounts);

      const [discount] = await baseQuery.where(eq(orderDiscounts._id, discountId)).limit(1);
      return discount
        ? selectColumns
          ? (discount as SelectOrderDiscount as OrderDiscount)
          : rowToOrderDiscount(discount as OrderDiscountRow)
        : null;
    },

    findOrderDiscounts: async ({ orderId }: { orderId: string }): Promise<OrderDiscount[]> => {
      const rows = await db.select().from(orderDiscounts).where(eq(orderDiscounts.orderId, orderId));
      return rows.map(rowToOrderDiscount);
    },

    create: async (
      doc: Pick<OrderDiscount, 'discountKey'> & Partial<Omit<OrderDiscount, 'discountKey'>>,
    ): Promise<OrderDiscount> => {
      const normalizedTrigger = doc.trigger || OrderDiscountTrigger.USER;
      const discountId = doc._id || generateId();
      const now = new Date();

      await db.insert(orderDiscounts).values({
        _id: discountId,
        created: now,
        discountKey: doc.discountKey,
        orderId: doc.orderId ?? null,
        code: doc.code ?? null,
        trigger: normalizedTrigger,
        context: doc.context ?? {},
      });

      const [discount] = await db
        .select()
        .from(orderDiscounts)
        .where(eq(orderDiscounts._id, discountId))
        .limit(1);

      const result = rowToOrderDiscount(discount);
      await emit('ORDER_CREATE_DISCOUNT', { discount: result });
      return result;
    },

    delete: async (orderDiscountId: string) => {
      const [orderDiscount] = await db
        .select()
        .from(orderDiscounts)
        .where(eq(orderDiscounts._id, orderDiscountId))
        .limit(1);

      if (orderDiscount) {
        const result = rowToOrderDiscount(orderDiscount);
        await db.delete(orderDiscounts).where(eq(orderDiscounts._id, orderDiscountId));
        await emit('ORDER_REMOVE_DISCOUNT', { discount: result });
        return result;
      }

      return null;
    },

    isDiscountCodeUsed: async ({
      code,
      orderId,
    }: {
      code: string;
      orderId: string;
    }): Promise<boolean> => {
      const [result] = await db
        .select({ count: orderDiscounts._id })
        .from(orderDiscounts)
        .where(and(eq(orderDiscounts.code, code), eq(orderDiscounts.orderId, orderId)))
        .limit(1);

      return !!result;
    },

    findSpareDiscount: async ({ code }: { code: string }) => {
      const [discount] = await db
        .select()
        .from(orderDiscounts)
        .where(and(eq(orderDiscounts.code, code), isNull(orderDiscounts.orderId)))
        .limit(1);

      return discount ? rowToOrderDiscount(discount) : null;
    },

    update: async (orderDiscountId: string, doc: Partial<OrderDiscount>) => {
      await db
        .update(orderDiscounts)
        .set({
          ...doc,
          updated: new Date(),
        })
        .where(eq(orderDiscounts._id, orderDiscountId));

      const [discount] = await db
        .select()
        .from(orderDiscounts)
        .where(eq(orderDiscounts._id, orderDiscountId))
        .limit(1);

      const result = discount ? rowToOrderDiscount(discount) : null;
      await emit('ORDER_UPDATE_DISCOUNT', { discount: result });
      return result;
    },

    deleteOrderDiscounts: async (orderId: string) => {
      const result = await db.delete(orderDiscounts).where(eq(orderDiscounts.orderId, orderId));
      return result.rowsAffected;
    },
  };
};

export type OrderDiscountsModule = ReturnType<typeof configureOrderDiscountsModule>;
