import { emit, registerEvents } from '@unchainedshop/events';
import type { Address, Contact } from '@unchainedshop/utils';
import { eq, and, type DrizzleDb, generateId } from '@unchainedshop/store';
import { orders, orderPositions, OrderStatus, rowToOrder, type Order } from '../db/schema.ts';
import { upsertOrderFTS, deleteOrderFTS } from '../db/fts.ts';

const ORDER_EVENTS: string[] = [
  'ORDER_CREATE',
  'ORDER_REMOVE',
  'ORDER_SET_DELIVERY_PROVIDER',
  'ORDER_SET_PAYMENT_PROVIDER',
  'ORDER_UPDATE',
];

export const configureOrderModuleMutations = ({ db }: { db: DrizzleDb }) => {
  registerEvents(ORDER_EVENTS);

  return {
    create: async ({
      userId,
      orderNumber,
      currencyCode,
      countryCode,
      billingAddress,
      contact,
      context,
    }: {
      userId: string;
      billingAddress?: Address;
      contact?: Contact;
      countryCode: string;
      currencyCode: string;
      orderNumber?: string;
      originEnrollmentId?: string;
      context?: Record<string, any>;
    }) => {
      const orderId = generateId();
      const now = new Date();

      await db.insert(orders).values({
        _id: orderId,
        created: now,
        status: null,
        billingAddress,
        contact,
        userId,
        currencyCode,
        countryCode,
        calculation: [],
        log: [],
        orderNumber,
        context: context || {},
      });

      const [row] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      // Update FTS index
      await upsertOrderFTS(db, row);

      const order = rowToOrder(row);
      await emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId: string) => {
      const result = await db.delete(orders).where(eq(orders._id, orderId));
      if (!result.rowsAffected) return 0;

      // Remove from FTS index
      await deleteOrderFTS(db, orderId);

      await emit('ORDER_REMOVE', { orderId });
      return result.rowsAffected;
    },

    setCartOwner: async ({ orderId, userId }: { orderId: string; userId: string }) => {
      await db.update(orders).set({ userId }).where(eq(orders._id, orderId));

      // Update FTS index
      const [order] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);
      if (order) {
        await upsertOrderFTS(db, order);
      }
    },

    moveCartPositions: async ({
      fromOrderId,
      toOrderId,
    }: {
      fromOrderId: string;
      toOrderId: string;
    }) => {
      await db
        .update(orderPositions)
        .set({ orderId: toOrderId })
        .where(eq(orderPositions.orderId, fromOrderId));
    },

    updateBillingAddress: async (orderId: string, billingAddress: Address): Promise<Order | null> => {
      await db
        .update(orders)
        .set({
          billingAddress,
          updated: new Date(),
        })
        .where(eq(orders._id, orderId));

      const [row] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!row) return null;
      const order = rowToOrder(row);
      await emit('ORDER_UPDATE', { order, field: 'billingAddress' });
      return order;
    },

    updateContact: async (orderId: string, contact: Contact): Promise<Order | null> => {
      await db
        .update(orders)
        .set({
          contact,
          updated: new Date(),
        })
        .where(eq(orders._id, orderId));

      const [row] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!row) return null;

      // Update FTS index (contact has searchable fields)
      await upsertOrderFTS(db, row);

      const order = rowToOrder(row);
      await emit('ORDER_UPDATE', { order, field: 'contact' });
      return order;
    },

    updateCalculationSheet: async (orderId: string, calculation: any): Promise<Order | null> => {
      await db
        .update(orders)
        .set({
          calculation,
          updated: new Date(),
        })
        .where(eq(orders._id, orderId));

      const [row] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!row) return null;
      const order = rowToOrder(row);
      await emit('ORDER_UPDATE', { order, field: 'calculation' });
      return order;
    },

    updateContext: async (orderId: string, context: any): Promise<Order | null> => {
      // Only update if order is a cart or pending
      const [current] = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders._id, orderId),
            // Status is null (cart) or PENDING
            // Using isNull since we're checking for null status
          ),
        )
        .limit(1);

      if (!current) return null;

      // Only allow updates if status is null (cart) or PENDING
      if (current.status !== null && current.status !== OrderStatus.PENDING) {
        return rowToOrder(current);
      }

      if (!context || Object.keys(context).length === 0) return rowToOrder(current);

      const mergedContext = { ...(current.context || {}), ...context };

      await db
        .update(orders)
        .set({
          context: mergedContext,
          updated: new Date(),
        })
        .where(eq(orders._id, orderId));

      const [row] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!row) return null;
      const order = rowToOrder(row);
      await emit('ORDER_UPDATE', { order, field: 'context' });
      return order;
    },

    updateCartFields: async (
      orderId: string,
      updates: {
        meta?: any;
        billingAddress?: Address;
        contact?: Contact;
      },
    ): Promise<Order | null> => {
      const [current] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!current) return null;

      const setFields: Record<string, unknown> = { updated: new Date() };

      if (updates.billingAddress) {
        setFields.billingAddress = updates.billingAddress;
      }
      if (updates.contact) {
        setFields.contact = updates.contact;
      }
      if (updates.meta && Object.keys(updates.meta).length > 0) {
        setFields.context = { ...(current.context || {}), ...updates.meta };
      }

      if (Object.keys(setFields).length === 1) {
        // Only 'updated' field, nothing to update
        return rowToOrder(current);
      }

      await db.update(orders).set(setFields).where(eq(orders._id, orderId));

      const [row] = await db.select().from(orders).where(eq(orders._id, orderId)).limit(1);

      if (!row) return null;

      // Update FTS index if contact changed
      if (updates.contact) {
        await upsertOrderFTS(db, row);
      }

      const order = rowToOrder(row);
      await emit('ORDER_UPDATE', { order, field: 'cartFields' });
      return order;
    },
  };
};

export type OrderMutations = ReturnType<typeof configureOrderModuleMutations>;
