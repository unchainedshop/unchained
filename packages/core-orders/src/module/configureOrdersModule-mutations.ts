import { emit, registerEvents } from '@unchainedshop/events';
import { normalizePhoneNumber } from '@unchainedshop/utils';
import {
  type Address,
  type Contact,
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
} from '@unchainedshop/mongodb';
import { type Order, OrderStatus } from '../db/OrdersCollection.ts';
import type { OrderPosition } from '../db/OrderPositionsCollection.ts';

const ORDER_EVENTS: string[] = [
  'ORDER_CREATE',
  'ORDER_REMOVE',
  'ORDER_SET_DELIVERY_PROVIDER',
  'ORDER_SET_PAYMENT_PROVIDER',
  'ORDER_UPDATE',
  'ORDER_ANONYMIZED',
];

export interface OrderUpdateEventOptions {
  // 'order' (default) emits ORDER_UPDATE with the updated order. 'ids' emits an
  // OrderUpdateKeysEventPayload instead, so the new values stay out of the event.
  eventPayload?: 'order' | 'ids';
}

export interface OrderUpdateKeysEventPayload {
  orderId: string;
  field: string;
  // The keys of the field whose value changed
  keys: string[];
}

export interface OrderAnonymizeOptions {
  // Keys (or dot paths) of order.context to remove, the rest of the context is kept
  contextKeys?: string[];
  // Replaces the whole context with {}, contextKeys are ignored then
  clearContext?: boolean;
}

export interface OrderAnonymizedEventPayload {
  orderId: string;
}

// The keys whose value differs between two flat objects, such as two contacts
const changedKeys = (before?: Record<string, any> | null, after?: Record<string, any> | null) =>
  [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])].filter(
    (key) => (before?.[key] ?? null) !== (after?.[key] ?? null),
  );

export const configureOrderModuleMutations = ({
  Orders,
  OrderPositions,
}: {
  Orders: mongodb.Collection<Order>;
  OrderPositions: mongodb.Collection<OrderPosition>;
}) => {
  registerEvents(ORDER_EVENTS);

  // Stores the order contact's phone number in normalized E.164 format, falling back
  // to the original value when it cannot be parsed (it has already passed input validation).
  const normalizeContactPhone = <T extends Contact | undefined>(
    contact: T,
    defaultCountry?: string,
  ): T => {
    if (!contact?.telNumber) return contact;
    return {
      ...contact,
      telNumber: normalizePhoneNumber(contact.telNumber, defaultCountry) || contact.telNumber,
    } as T;
  };

  return {
    create: async ({
      userId,
      orderNumber,
      currencyCode,
      countryCode,
      billingAddress,
      contact,
      originEnrollmentId,
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
      const { insertedId: orderId } = await Orders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        status: null,
        billingAddress,
        contact: normalizeContactPhone(contact, billingAddress?.countryCode || countryCode),
        userId,
        currencyCode,
        countryCode,
        calculation: [],
        log: [],
        orderNumber,
        originEnrollmentId,
        context: context || {},
      });

      const order = (await Orders.findOne(generateDbFilterById(orderId), {})) as Order;

      await emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId: string) => {
      const { deletedCount } = await Orders.deleteOne({ _id: orderId });
      if (!deletedCount) return 0;
      await emit('ORDER_REMOVE', { orderId });
      return deletedCount;
    },

    setCartOwner: async ({ orderId, userId }: { orderId: string; userId: string }) => {
      await Orders.updateOne(generateDbFilterById(orderId), {
        $set: {
          userId,
        },
      });
    },

    moveCartPositions: async ({
      fromOrderId,
      toOrderId,
    }: {
      fromOrderId: string;
      toOrderId: string;
    }) => {
      await OrderPositions.updateMany(
        { orderId: fromOrderId },
        {
          $set: {
            orderId: toOrderId,
          },
        },
      );
    },

    updateBillingAddress: async (orderId: string, billingAddress: Address) => {
      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            billingAddress,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      if (!order) return null;
      await emit('ORDER_UPDATE', { order, field: 'billingAddress' });
      return order;
    },

    updateContact: async (
      orderId: string,
      contact: Contact,
      { eventPayload = 'order' }: OrderUpdateEventOptions = {},
    ) => {
      const selector = generateDbFilterById(orderId);
      const existing = await Orders.findOne(selector, {
        projection: { billingAddress: true, countryCode: true, contact: true },
      });
      const defaultCountry = existing?.billingAddress?.countryCode || existing?.countryCode;
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            contact: normalizeContactPhone(contact, defaultCountry),
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      if (!order) return null;
      if (eventPayload === 'ids') {
        await emit('ORDER_UPDATE', {
          orderId: order._id,
          field: 'contact',
          keys: changedKeys(existing?.contact, order.contact),
        } satisfies OrderUpdateKeysEventPayload);
      } else {
        await emit('ORDER_UPDATE', { order, field: 'contact' });
      }
      return order;
    },

    updateCalculationSheet: async (orderId: string, calculation: any) => {
      const selector = generateDbFilterById(orderId);
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            calculation,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      if (!order) return null;
      await emit('ORDER_UPDATE', { order, field: 'calculation' });
      return order;
    },

    updateContext: async (orderId: string, context: any) => {
      const selector = generateDbFilterById<Order>(orderId);
      selector.status = { $in: [null, OrderStatus.PENDING] };

      if (!context || Object.keys(context).length === 0) return Orders.findOne(selector, {});

      const contextSetters = Object.fromEntries(
        Object.entries(context).map(([key, value]) => [`context.${key}`, value]),
      );
      const order = await Orders.findOneAndUpdate(
        selector,
        {
          $set: {
            ...contextSetters,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      if (!order) return null;
      await emit('ORDER_UPDATE', { order, field: 'context' });
      return order;
    },

    // Removes the personal data of an order in any status: the contact, the billing address and
    // the given context keys. Repeating it changes nothing (and emits nothing) unless there is
    // something left to remove; `anonymized` keeps the date of the first call.
    anonymize: async (
      orderId: string,
      { contextKeys = [], clearContext = false }: OrderAnonymizeOptions = {},
    ): Promise<Order | null> => {
      const selector = generateDbFilterById<Order>(orderId);
      const contextPaths = clearContext ? [] : contextKeys.map((key) => `context.${key}`);
      const date = new Date();
      const order = await Orders.findOneAndUpdate(
        {
          ...selector,
          $or: [
            { anonymized: { $exists: false } },
            { contact: { $exists: true } },
            { billingAddress: { $exists: true } },
            ...(clearContext
              ? [{ context: { $ne: {} } }]
              : contextPaths.map((path) => ({ [path]: { $exists: true } }))),
          ],
        },
        {
          $set: clearContext ? { context: {}, updated: date } : { updated: date },
          $min: { anonymized: date },
          $unset: Object.fromEntries(
            ['contact', 'billingAddress', ...contextPaths].map((path) => [path, 1]),
          ),
        },
        { returnDocument: 'after' },
      );
      if (!order) return Orders.findOne(selector, {});
      // Ids only, so neither the events collection nor a subscriber gets the removed data
      await emit('ORDER_ANONYMIZED', { orderId: order._id } satisfies OrderAnonymizedEventPayload);
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
      const $set: Record<string, any> = { updated: new Date() };

      if (updates.billingAddress) {
        $set.billingAddress = updates.billingAddress;
      }
      if (updates.contact) {
        let defaultCountry = updates.billingAddress?.countryCode;
        if (!defaultCountry && updates.contact.telNumber) {
          const existing = await Orders.findOne(generateDbFilterById(orderId), {
            projection: { billingAddress: true, countryCode: true },
          });
          defaultCountry = existing?.billingAddress?.countryCode || existing?.countryCode;
        }
        $set.contact = normalizeContactPhone(updates.contact, defaultCountry);
      }
      if (updates.meta && Object.keys(updates.meta).length > 0) {
        const contextSetters = Object.fromEntries(
          Object.entries(updates.meta).map(([key, value]) => [`context.${key}`, value]),
        );
        Object.assign($set, contextSetters);
      }

      if (Object.keys($set).length === 1) {
        // Only 'updated' field, nothing to update
        return Orders.findOne(generateDbFilterById(orderId), {});
      }

      const order = await Orders.findOneAndUpdate(
        generateDbFilterById(orderId),
        { $set },
        { returnDocument: 'after' },
      );

      if (!order) return null;
      await emit('ORDER_UPDATE', { order, field: 'cartFields' });
      return order;
    },
  };
};

export type OrderMutations = ReturnType<typeof configureOrderModuleMutations>;
