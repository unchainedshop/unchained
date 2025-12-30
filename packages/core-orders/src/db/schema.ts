/**
 * Drizzle ORM schema for core-orders
 * Tables: orders, order_positions, order_payments, order_deliveries, order_discounts
 */

import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import type { Address, Contact } from '@unchainedshop/mongodb';
import type { Price } from '@unchainedshop/utils';

// Log entry type for order-related entities
export interface OrderLogEntry {
  date: Date;
  status?: string;
  info?: string;
}

// ============ ORDERS ============

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export const orders = sqliteTable(
  'orders',
  {
    _id: text('_id').primaryKey(),
    userId: text('userId').notNull(),
    status: text('status'), // null = cart, or OrderStatus
    orderNumber: text('orderNumber'),
    countryCode: text('countryCode').notNull(),
    currencyCode: text('currencyCode').notNull(),
    deliveryId: text('deliveryId'),
    paymentId: text('paymentId'),
    originEnrollmentId: text('originEnrollmentId'),
    // Nested as JSON
    billingAddress: text('billingAddress', { mode: 'json' }).$type<Address>(),
    contact: text('contact', { mode: 'json' }).$type<Contact>(),
    calculation: text('calculation', { mode: 'json' }).$type<any[]>().default([]),
    context: text('context', { mode: 'json' }),
    log: text('log', { mode: 'json' }).$type<OrderLogEntry[]>().default([]),
    // Dates
    ordered: integer('ordered', { mode: 'timestamp_ms' }),
    confirmed: integer('confirmed', { mode: 'timestamp_ms' }),
    fulfilled: integer('fulfilled', { mode: 'timestamp_ms' }),
    rejected: integer('rejected', { mode: 'timestamp_ms' }),
    // Timestamps
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_orders_userId').on(table.userId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_orderNumber').on(table.orderNumber),
    index('idx_orders_deleted').on(table.deleted),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;

// Domain interface with undefined for optional fields (matching tier 1/2 pattern)
export interface Order {
  _id: string;
  userId: string;
  status: string | null;
  orderNumber?: string;
  countryCode: string;
  currencyCode: string;
  deliveryId?: string;
  paymentId?: string;
  originEnrollmentId?: string;
  billingAddress?: Address;
  contact?: Contact;
  calculation: any[];
  context?: Record<string, unknown>;
  log: OrderLogEntry[];
  ordered?: Date;
  confirmed?: Date;
  fulfilled?: Date;
  rejected?: Date;
  created: Date;
  updated?: Date;
  deleted?: Date;
}

export const rowToOrder = (row: OrderRow): Order => ({
  _id: row._id,
  userId: row.userId,
  status: row.status,
  orderNumber: row.orderNumber ?? undefined,
  countryCode: row.countryCode,
  currencyCode: row.currencyCode,
  deliveryId: row.deliveryId ?? undefined,
  paymentId: row.paymentId ?? undefined,
  originEnrollmentId: row.originEnrollmentId ?? undefined,
  billingAddress: row.billingAddress ?? undefined,
  contact: row.contact ?? undefined,
  calculation: row.calculation ?? [],
  context: (row.context as Record<string, unknown>) ?? undefined,
  log: row.log ?? [],
  ordered: row.ordered ?? undefined,
  confirmed: row.confirmed ?? undefined,
  fulfilled: row.fulfilled ?? undefined,
  rejected: row.rejected ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? undefined,
});

// ============ ORDER POSITIONS ============

export interface OrderPositionConfiguration {
  key: string;
  value: string;
}

export const orderPositions = sqliteTable(
  'order_positions',
  {
    _id: text('_id').primaryKey(),
    orderId: text('orderId').notNull(),
    productId: text('productId').notNull(),
    originalProductId: text('originalProductId').notNull(),
    quantity: integer('quantity').notNull(),
    quotationId: text('quotationId'),
    // Nested as JSON
    configuration: text('configuration', { mode: 'json' }).$type<OrderPositionConfiguration[] | null>(),
    calculation: text('calculation', { mode: 'json' }).$type<any[]>().default([]),
    scheduling: text('scheduling', { mode: 'json' }).$type<any[]>().default([]),
    context: text('context', { mode: 'json' }),
    // Timestamps
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_order_positions_orderId').on(table.orderId),
    index('idx_order_positions_productId').on(table.productId),
  ],
);

export type OrderPositionRow = typeof orderPositions.$inferSelect;
export type NewOrderPositionRow = typeof orderPositions.$inferInsert;

// Domain interface with undefined for optional fields
export interface OrderPosition {
  _id: string;
  orderId: string;
  productId: string;
  originalProductId: string;
  quantity: number;
  quotationId?: string;
  configuration?: OrderPositionConfiguration[];
  calculation: any[];
  scheduling: any[];
  context?: Record<string, unknown>;
  created: Date;
  updated?: Date;
}

export const rowToOrderPosition = (row: OrderPositionRow): OrderPosition => ({
  _id: row._id,
  orderId: row.orderId,
  productId: row.productId,
  originalProductId: row.originalProductId,
  quantity: row.quantity,
  quotationId: row.quotationId ?? undefined,
  configuration: row.configuration ?? undefined,
  calculation: row.calculation ?? [],
  scheduling: row.scheduling ?? [],
  context: (row.context as Record<string, unknown>) ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

export type OrderPositionDiscount = Omit<Price, '_id'> & {
  discountId: string;
  item: OrderPosition;
};

// ============ ORDER PAYMENTS ============

export const OrderPaymentStatus = {
  OPEN: 'OPEN', // Null value is mapped to OPEN status
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const;

export type OrderPaymentStatusType = (typeof OrderPaymentStatus)[keyof typeof OrderPaymentStatus];

export const orderPayments = sqliteTable(
  'order_payments',
  {
    _id: text('_id').primaryKey(),
    orderId: text('orderId').notNull(),
    paymentProviderId: text('paymentProviderId').notNull(),
    status: text('status'), // null maps to OPEN
    transactionId: text('transactionId'),
    paid: integer('paid', { mode: 'timestamp_ms' }),
    // Nested as JSON
    calculation: text('calculation', { mode: 'json' }).$type<any[]>().default([]),
    context: text('context', { mode: 'json' }),
    log: text('log', { mode: 'json' }).$type<OrderLogEntry[]>().default([]),
    // Timestamps
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [index('idx_order_payments_orderId').on(table.orderId)],
);

export type OrderPaymentRow = typeof orderPayments.$inferSelect;
export type NewOrderPaymentRow = typeof orderPayments.$inferInsert;

// Domain interface with undefined for optional fields
export interface OrderPayment {
  _id: string;
  orderId: string;
  paymentProviderId: string;
  status: string | null;
  transactionId?: string;
  paid?: Date;
  calculation: any[];
  context?: Record<string, unknown>;
  log: OrderLogEntry[];
  created: Date;
  updated?: Date;
}

export const rowToOrderPayment = (row: OrderPaymentRow): OrderPayment => ({
  _id: row._id,
  orderId: row.orderId,
  paymentProviderId: row.paymentProviderId,
  status: row.status,
  transactionId: row.transactionId ?? undefined,
  paid: row.paid ?? undefined,
  calculation: row.calculation ?? [],
  context: (row.context as Record<string, unknown>) ?? undefined,
  log: row.log ?? [],
  created: row.created,
  updated: row.updated ?? undefined,
});

export type OrderPaymentDiscount = Omit<Price, '_id'> & {
  _id: string;
  discountId: string;
  item: OrderPayment;
};

// ============ ORDER DELIVERIES ============

export const OrderDeliveryStatus = {
  OPEN: 'OPEN', // Null value is mapped to OPEN status
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
} as const;

export type OrderDeliveryStatusType = (typeof OrderDeliveryStatus)[keyof typeof OrderDeliveryStatus];

export const orderDeliveries = sqliteTable(
  'order_deliveries',
  {
    _id: text('_id').primaryKey(),
    orderId: text('orderId').notNull(),
    deliveryProviderId: text('deliveryProviderId').notNull(),
    status: text('status'), // null maps to OPEN
    delivered: integer('delivered', { mode: 'timestamp_ms' }),
    // Nested as JSON
    calculation: text('calculation', { mode: 'json' }).$type<any[]>().default([]),
    context: text('context', { mode: 'json' }),
    log: text('log', { mode: 'json' }).$type<OrderLogEntry[]>().default([]),
    // Timestamps
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [index('idx_order_deliveries_orderId').on(table.orderId)],
);

export type OrderDeliveryRow = typeof orderDeliveries.$inferSelect;
export type NewOrderDeliveryRow = typeof orderDeliveries.$inferInsert;

// Domain interface with undefined for optional fields
export interface OrderDelivery {
  _id: string;
  orderId: string;
  deliveryProviderId: string;
  status: string | null;
  delivered?: Date;
  calculation: any[];
  context?: Record<string, unknown>;
  log: OrderLogEntry[];
  created: Date;
  updated?: Date;
}

export const rowToOrderDelivery = (row: OrderDeliveryRow): OrderDelivery => ({
  _id: row._id,
  orderId: row.orderId,
  deliveryProviderId: row.deliveryProviderId,
  status: row.status,
  delivered: row.delivered ?? undefined,
  calculation: row.calculation ?? [],
  context: (row.context as Record<string, unknown>) ?? undefined,
  log: row.log ?? [],
  created: row.created,
  updated: row.updated ?? undefined,
});

export type OrderDeliveryDiscount = Omit<Price, '_id'> & {
  _id: string;
  discountId: string;
  item: OrderDelivery;
};

// ============ ORDER DISCOUNTS ============

export const OrderDiscountTrigger = {
  USER: 'USER',
  SYSTEM: 'SYSTEM',
} as const;

export type OrderDiscountTriggerType = (typeof OrderDiscountTrigger)[keyof typeof OrderDiscountTrigger];

export const orderDiscounts = sqliteTable(
  'order_discounts',
  {
    _id: text('_id').primaryKey(),
    orderId: text('orderId'), // Can be null for spare discounts
    code: text('code'),
    discountKey: text('discountKey').notNull(),
    trigger: text('trigger'), // OrderDiscountTrigger
    // Nested as JSON
    total: text('total', { mode: 'json' }).$type<Price>(),
    reservation: text('reservation', { mode: 'json' }),
    context: text('context', { mode: 'json' }),
    // Timestamps
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_order_discounts_orderId').on(table.orderId),
    index('idx_order_discounts_trigger').on(table.trigger),
  ],
);

export type OrderDiscountRow = typeof orderDiscounts.$inferSelect;
export type NewOrderDiscountRow = typeof orderDiscounts.$inferInsert;

// Domain interface with undefined for optional fields
export interface OrderDiscount {
  _id: string;
  orderId?: string;
  code?: string;
  discountKey: string;
  trigger?: string;
  total?: Price;
  reservation?: unknown;
  context?: Record<string, unknown>;
  created: Date;
  updated?: Date;
}

export const rowToOrderDiscount = (row: OrderDiscountRow): OrderDiscount => ({
  _id: row._id,
  orderId: row.orderId ?? undefined,
  code: row.code ?? undefined,
  discountKey: row.discountKey,
  trigger: row.trigger ?? undefined,
  total: row.total ?? undefined,
  reservation: row.reservation ?? undefined,
  context: (row.context as Record<string, unknown>) ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});
