import { SortDirection, type SortOption } from '@unchainedshop/utils';
import {
  eq,
  and,
  isNull,
  isNotNull,
  inArray,
  gte,
  lte,
  desc,
  asc,
  sql,
  buildSelectColumns,
  type DrizzleDb,
  type SQL,
} from '@unchainedshop/store';
import { orders, OrderStatus, rowToOrder, type Order, type OrderRow } from '../db/schema.ts';
import type { DateFilterInput } from '@unchainedshop/utils';

// Column mapping for field selection
const ORDERS_COLUMNS = {
  _id: orders._id,
  userId: orders.userId,
  status: orders.status,
  orderNumber: orders.orderNumber,
  countryCode: orders.countryCode,
  currencyCode: orders.currencyCode,
  deliveryId: orders.deliveryId,
  paymentId: orders.paymentId,
  originEnrollmentId: orders.originEnrollmentId,
  billingAddress: orders.billingAddress,
  contact: orders.contact,
  calculation: orders.calculation,
  context: orders.context,
  log: orders.log,
  ordered: orders.ordered,
  confirmed: orders.confirmed,
  fulfilled: orders.fulfilled,
  rejected: orders.rejected,
  created: orders.created,
  updated: orders.updated,
  deleted: orders.deleted,
} as const;

export type OrderFields = keyof typeof ORDERS_COLUMNS;

export interface OrderQueryOptions {
  fields?: OrderFields[];
}

export interface OrderQuery {
  includeCarts?: boolean;
  status?: (typeof OrderStatus)[keyof typeof OrderStatus][];
  userId?: string;
  deliveryIds?: string[];
  paymentIds?: string[];
  dateRange?: DateFilterInput;
  orderIds?: string[];
  searchOrderIds?: string[];
  // Used by API layer to filter by provider IDs (resolved to payment/delivery IDs before query)
  paymentProviderIds?: string[];
  deliveryProviderIds?: string[];
}

export interface OrderReport {
  newCount: number;
  checkoutCount: number;
  rejectCount: number;
  confirmCount: number;
  fulfillCount: number;
}

export interface TopCustomerRecord {
  userId: string;
  currencyCode: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: Date;
  averageOrderValue: number;
}
export interface OrderStatisticsRecord {
  date: string;
  count: number;
  total: {
    amount: number;
    currencyCode: string;
  };
}

export interface DateRange {
  start?: string;
  end?: string;
}

export type StatisticsDateField = 'created' | 'ordered' | 'rejected' | 'confirmed' | 'fulfilled';

const buildConditions = ({
  includeCarts,
  status,
  userId,
  paymentIds,
  deliveryIds,
  dateRange,
  orderIds,
  searchOrderIds,
}: OrderQuery): SQL[] => {
  const conditions: SQL[] = [];

  if (userId) {
    conditions.push(eq(orders.userId, userId));
  }

  if (orderIds?.length) {
    conditions.push(inArray(orders._id, orderIds));
  }

  if (searchOrderIds?.length) {
    conditions.push(inArray(orders._id, searchOrderIds));
  }

  if (dateRange) {
    if (dateRange.start) {
      conditions.push(gte(orders.ordered, new Date(dateRange.start)));
    }
    if (dateRange.end) {
      conditions.push(lte(orders.ordered, new Date(dateRange.end)));
    }
  }

  if (deliveryIds?.length) {
    conditions.push(inArray(orders.deliveryId, deliveryIds));
  }

  if (paymentIds?.length) {
    conditions.push(inArray(orders.paymentId, paymentIds));
  }

  if (status?.length) {
    conditions.push(inArray(orders.status, status));
  } else if (!includeCarts) {
    conditions.push(isNotNull(orders.status));
  }

  return conditions;
};

const buildSortOrder = (sort: SortOption[]) => {
  return sort.map((s) => {
    // Map sort keys to column expressions
    switch (s.key) {
      case '_id':
        return s.value === SortDirection.ASC ? asc(orders._id) : desc(orders._id);
      case 'created':
        return s.value === SortDirection.ASC ? asc(orders.created) : desc(orders.created);
      case 'updated':
        return s.value === SortDirection.ASC ? asc(orders.updated) : desc(orders.updated);
      case 'ordered':
        return s.value === SortDirection.ASC ? asc(orders.ordered) : desc(orders.ordered);
      case 'confirmed':
        return s.value === SortDirection.ASC ? asc(orders.confirmed) : desc(orders.confirmed);
      case 'fulfilled':
        return s.value === SortDirection.ASC ? asc(orders.fulfilled) : desc(orders.fulfilled);
      case 'rejected':
        return s.value === SortDirection.ASC ? asc(orders.rejected) : desc(orders.rejected);
      case 'orderNumber':
        return s.value === SortDirection.ASC ? asc(orders.orderNumber) : desc(orders.orderNumber);
      case 'status':
        return s.value === SortDirection.ASC ? asc(orders.status) : desc(orders.status);
      case 'userId':
        return s.value === SortDirection.ASC ? asc(orders.userId) : desc(orders.userId);
      default:
        return desc(orders.created);
    }
  });
};

export const configureOrdersModuleQueries = ({ db }: { db: DrizzleDb }) => {
  return {
    isCart: (order: Order) => {
      return order.status === null;
    },

    cart: async ({
      orderNumber,
      countryCode,
      userId,
    }: {
      countryCode?: string;
      orderNumber?: string;
      userId: string;
    }): Promise<Order | null> => {
      const conditions: SQL[] = [eq(orders.userId, userId), isNull(orders.status)];

      if (countryCode) {
        conditions.push(eq(orders.countryCode, countryCode));
      }

      if (orderNumber) {
        conditions.push(eq(orders.orderNumber, orderNumber));
      }

      const [row] = await db
        .select()
        .from(orders)
        .where(and(...conditions))
        .orderBy(desc(orders.updated))
        .limit(1);

      return row ? rowToOrder(row) : null;
    },

    count: async (query: OrderQuery): Promise<number> => {
      const conditions = buildConditions(query);

      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(conditions.length ? and(...conditions) : undefined);

      return result?.count || 0;
    },

    findOrder: async (
      {
        orderId,
        orderNumber,
      }: {
        orderId?: string;
        orderNumber?: string;
      },
      options?: OrderQueryOptions,
    ): Promise<Order | null> => {
      const selectColumns = buildSelectColumns(ORDERS_COLUMNS, options?.fields);

      if (orderId) {
        const baseQuery = selectColumns
          ? db.select(selectColumns).from(orders)
          : db.select().from(orders);
        const [row] = await baseQuery.where(eq(orders._id, orderId)).limit(1);
        return row ? (selectColumns ? (row as Order) : rowToOrder(row as OrderRow)) : null;
      }
      if (orderNumber) {
        const baseQuery = selectColumns
          ? db.select(selectColumns).from(orders)
          : db.select().from(orders);
        const [row] = await baseQuery.where(eq(orders.orderNumber, orderNumber)).limit(1);
        return row ? (selectColumns ? (row as Order) : rowToOrder(row as OrderRow)) : null;
      }
      return null;
    },

    findCartsToInvalidate: async (maxAgeDays = 30): Promise<Order[]> => {
      const ONE_DAY_IN_MILLISECONDS = 86400000;
      const minValidDate = new Date(new Date().getTime() - maxAgeDays * ONE_DAY_IN_MILLISECONDS);

      const rows = await db
        .select()
        .from(orders)
        .where(and(isNull(orders.status), gte(orders.updated, minValidDate)));

      return rows.map(rowToOrder);
    },

    findOrders: async (
      {
        limit,
        offset,
        sort,
        ...query
      }: OrderQuery & {
        limit?: number;
        offset?: number;
        sort?: SortOption[];
      },
      options?: OrderQueryOptions,
    ): Promise<Order[]> => {
      const defaultSortOption: SortOption[] = [{ key: 'created', value: SortDirection.DESC }];
      const conditions = buildConditions(query);

      const selectColumns = buildSelectColumns(ORDERS_COLUMNS, options?.fields);

      const baseQuery = selectColumns ? db.select(selectColumns).from(orders) : db.select().from(orders);

      let ordersQuery = baseQuery
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(...buildSortOrder(sort || defaultSortOption));

      if (typeof offset === 'number') {
        ordersQuery = ordersQuery.offset(offset) as typeof ordersQuery;
      }
      if (typeof limit === 'number') {
        ordersQuery = ordersQuery.limit(limit) as typeof ordersQuery;
      }

      const rows = await ordersQuery;
      return selectColumns ? (rows as Order[]) : rows.map((row) => rowToOrder(row as OrderRow));
    },

    orderExists: async ({ orderId }: { orderId: string }): Promise<boolean> => {
      const [result] = await db
        .select({ _id: orders._id })
        .from(orders)
        .where(eq(orders._id, orderId))
        .limit(1);
      return !!result;
    },

    // Statistics methods
    statistics: {
      async countByDateField(
        dateField: StatisticsDateField,
        dateRange?: DateRange,
        options?: { includeCarts?: boolean },
      ): Promise<number> {
        const conditions: SQL[] = [];

        // Date field must exist
        const dateColumn = orders[dateField];
        if (dateRange?.start || dateRange?.end) {
          if (dateRange.start) {
            conditions.push(gte(dateColumn, new Date(dateRange.start)));
          }
          if (dateRange.end) {
            conditions.push(lte(dateColumn, new Date(dateRange.end)));
          }
        } else {
          conditions.push(isNotNull(dateColumn));
        }

        if (options?.includeCarts) {
          conditions.push(isNull(orders.status));
          conditions.push(isNull(orders.orderNumber));
        }

        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(orders)
          .where(and(...conditions));

        return result?.count || 0;
      },

      async aggregateByDateField(
        dateField: StatisticsDateField,
        dateRange?: DateRange,
        options?: { includeCarts?: boolean },
      ): Promise<OrderStatisticsRecord[]> {
        const conditions: SQL[] = [];

        // Date field must exist
        const dateColumn = orders[dateField];
        if (dateRange?.start || dateRange?.end) {
          if (dateRange.start) {
            conditions.push(gte(dateColumn, new Date(dateRange.start)));
          }
          if (dateRange.end) {
            conditions.push(lte(dateColumn, new Date(dateRange.end)));
          }
        } else {
          conditions.push(isNotNull(dateColumn));
        }

        if (options?.includeCarts) {
          conditions.push(isNull(orders.status));
          conditions.push(isNull(orders.orderNumber));
        }

        // Use SQL query for aggregation with JSON extraction
        const whereClause = conditions.length ? and(...conditions) : sql`1=1`;

        const rows = await db.all<{
          date: string;
          currencyCode: string;
          totalAmount: number;
          count: number;
        }>(
          sql`
            SELECT
              strftime('%Y-%m-%d', ${dateColumn}/1000, 'unixepoch') as date,
              currencyCode,
              COALESCE(SUM(
                CASE
                  WHEN json_valid(calculation) THEN
                    (SELECT COALESCE(SUM(CAST(json_extract(value, '$.amount') AS REAL)), 0)
                     FROM json_each(calculation))
                  ELSE 0
                END
              ), 0) as totalAmount,
              COUNT(*) as count
            FROM orders
            WHERE ${whereClause}
            GROUP BY date, currencyCode
            ORDER BY date ASC
          `,
        );

        return rows.map((row) => ({
          date: row.date,
          count: Number(row.count),
          total: {
            amount: Number(row.totalAmount),
            currencyCode: row.currencyCode,
          },
        }));
      },

      async getTopCustomers(
        orderIds: string[],
        options?: { limit?: number },
      ): Promise<TopCustomerRecord[]> {
        const limit = options?.limit || 10;

        if (!orderIds.length) return [];

        // SQL query to get top customers
        // The calculation array contains items like: [{ category: 'ITEMS', amount: 123 }, ...]
        const rows = await db.all<{
          userId: string;
          currencyCode: string;
          totalSpent: number;
          orderCount: number;
          lastOrderDate: number;
        }>(
          sql.raw(`
            SELECT
              userId,
              currencyCode,
              COALESCE(SUM(
                CASE
                  WHEN json_valid(calculation) THEN
                    (SELECT COALESCE(json_extract(value, '$.amount'), 0)
                     FROM json_each(calculation)
                     WHERE json_extract(value, '$.category') = 'ITEMS'
                     LIMIT 1)
                  ELSE 0
                END
              ), 0) as totalSpent,
              COUNT(*) as orderCount,
              MAX(created) as lastOrderDate
            FROM orders
            WHERE _id IN (${orderIds.map((id) => `'${id}'`).join(',')})
            GROUP BY userId, currencyCode
            HAVING totalSpent > 0
            ORDER BY totalSpent DESC
            LIMIT ${limit}
          `),
        );

        return rows.map((row) => ({
          userId: row.userId,
          currencyCode: row.currencyCode,
          totalSpent: Number(row.totalSpent),
          orderCount: Number(row.orderCount),
          lastOrderDate: new Date(row.lastOrderDate),
          averageOrderValue: row.orderCount > 0 ? Number(row.totalSpent) / Number(row.orderCount) : 0,
        }));
      },
    },
  };
};

export type OrderQueries = ReturnType<typeof configureOrdersModuleQueries>;
