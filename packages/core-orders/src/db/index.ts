import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupOrdersFTS } from './fts.ts';

// Re-export schema types and tables
export {
  orders,
  orderPositions,
  orderPayments,
  orderDeliveries,
  orderDiscounts,
  OrderStatus,
  OrderPaymentStatus,
  OrderDeliveryStatus,
  OrderDiscountTrigger,
  type OrderRow,
  type NewOrderRow,
  type Order,
  type OrderPositionRow,
  type NewOrderPositionRow,
  type OrderPosition,
  type OrderPositionConfiguration,
  type OrderPositionDiscount,
  type OrderPaymentRow,
  type NewOrderPaymentRow,
  type OrderPayment,
  type OrderPaymentDiscount,
  type OrderDeliveryRow,
  type NewOrderDeliveryRow,
  type OrderDelivery,
  type OrderDeliveryDiscount,
  type OrderDiscountRow,
  type NewOrderDiscountRow,
  type OrderDiscount,
  type OrderStatusType,
  type OrderPaymentStatusType,
  type OrderDeliveryStatusType,
  type OrderDiscountTriggerType,
  type OrderLogEntry,
} from './schema.ts';

export { searchOrdersFTS, upsertOrderFTS, deleteOrderFTS } from './fts.ts';

export async function initializeOrdersSchema(db: DrizzleDb): Promise<void> {
  // Create orders table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS orders (
      _id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      status TEXT,
      orderNumber TEXT,
      countryCode TEXT NOT NULL,
      currencyCode TEXT NOT NULL,
      deliveryId TEXT,
      paymentId TEXT,
      originEnrollmentId TEXT,
      billingAddress TEXT,
      contact TEXT,
      calculation TEXT DEFAULT '[]',
      context TEXT,
      log TEXT DEFAULT '[]',
      ordered INTEGER,
      confirmed INTEGER,
      fulfilled INTEGER,
      rejected INTEGER,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Orders indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders(orderNumber)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_orders_deleted ON orders(deleted)`);

  // Create order_positions table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS order_positions (
      _id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      originalProductId TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      quotationId TEXT,
      configuration TEXT,
      calculation TEXT DEFAULT '[]',
      scheduling TEXT DEFAULT '[]',
      context TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Order positions indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_order_positions_orderId ON order_positions(orderId)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_order_positions_productId ON order_positions(productId)`,
  );

  // Create order_payments table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS order_payments (
      _id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      paymentProviderId TEXT NOT NULL,
      status TEXT,
      transactionId TEXT,
      paid INTEGER,
      calculation TEXT DEFAULT '[]',
      context TEXT,
      log TEXT DEFAULT '[]',
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Order payments indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_order_payments_orderId ON order_payments(orderId)`);

  // Create order_deliveries table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS order_deliveries (
      _id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      deliveryProviderId TEXT NOT NULL,
      status TEXT,
      delivered INTEGER,
      calculation TEXT DEFAULT '[]',
      context TEXT,
      log TEXT DEFAULT '[]',
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Order deliveries indexes
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_order_deliveries_orderId ON order_deliveries(orderId)`,
  );

  // Create order_discounts table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS order_discounts (
      _id TEXT PRIMARY KEY,
      orderId TEXT,
      code TEXT,
      discountKey TEXT NOT NULL,
      trigger TEXT,
      total TEXT,
      reservation TEXT,
      context TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Order discounts indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_order_discounts_orderId ON order_discounts(orderId)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_order_discounts_trigger ON order_discounts(trigger)`);

  // Setup FTS
  await setupOrdersFTS(db);
}
