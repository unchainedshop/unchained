import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  gt,
  inArray,
  sql,
  type DrizzleDb,
  generateId,
  buildSelectColumns,
} from '@unchainedshop/store';
import type { PricingCalculation } from '@unchainedshop/utils';
import {
  orderPositions,
  rowToOrderPosition,
  type OrderPosition,
  type OrderPositionRow,
  type OrderPositionScheduling,
} from '../db/schema.ts';

type SelectOrderPosition = OrderPosition | Partial<OrderPosition>;

// Column mapping for field selection
const POSITION_COLUMNS = {
  _id: orderPositions._id,
  orderId: orderPositions.orderId,
  productId: orderPositions.productId,
  originalProductId: orderPositions.originalProductId,
  quantity: orderPositions.quantity,
  quotationId: orderPositions.quotationId,
  configuration: orderPositions.configuration,
  calculation: orderPositions.calculation,
  scheduling: orderPositions.scheduling,
  context: orderPositions.context,
  created: orderPositions.created,
  updated: orderPositions.updated,
} as const;

export type OrderPositionFields = keyof typeof POSITION_COLUMNS;

export interface OrderPositionQueryOptions {
  fields?: OrderPositionFields[];
}

const ORDER_POSITION_EVENTS: string[] = [
  'ORDER_UPDATE_CART_ITEM',
  'ORDER_REMOVE_CART_ITEM',
  'ORDER_EMPTY_CART',
  'ORDER_ADD_PRODUCT',
];

export interface TopProductRecord {
  productId: string;
  totalSold: number;
  totalRevenue: number;
}

export const configureOrderPositionsModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(ORDER_POSITION_EVENTS);

  return {
    // Queries
    findOrderPosition: async ({ itemId }: { itemId: string }, options?: OrderPositionQueryOptions) => {
      const selectColumns = buildSelectColumns(POSITION_COLUMNS, options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(orderPositions)
        : db.select().from(orderPositions);

      const [position] = await baseQuery.where(eq(orderPositions._id, itemId)).limit(1);
      return position
        ? selectColumns
          ? (position as SelectOrderPosition as OrderPosition)
          : rowToOrderPosition(position as OrderPositionRow)
        : null;
    },

    findOrderPositions: async (
      { orderId }: { orderId: string },
      options?: OrderPositionQueryOptions,
    ): Promise<OrderPosition[]> => {
      const selectColumns = buildSelectColumns(POSITION_COLUMNS, options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(orderPositions)
        : db.select().from(orderPositions);

      const rows = await baseQuery.where(
        and(eq(orderPositions.orderId, orderId), gt(orderPositions.quantity, 0)),
      );
      return selectColumns
        ? (rows as SelectOrderPosition[] as OrderPosition[])
        : rows.map((row) => rowToOrderPosition(row as OrderPositionRow));
    },

    delete: async (orderPositionId: string) => {
      const [orderPosition] = await db
        .select()
        .from(orderPositions)
        .where(eq(orderPositions._id, orderPositionId))
        .limit(1);

      if (orderPosition) {
        const result = rowToOrderPosition(orderPosition);
        await db.delete(orderPositions).where(eq(orderPositions._id, orderPositionId));
        await emit('ORDER_REMOVE_CART_ITEM', { orderPosition: result });
        return result;
      }
      return null;
    },

    deletePositions: async ({ orderId }: { orderId: string }): Promise<number> => {
      const result = await db.delete(orderPositions).where(eq(orderPositions.orderId, orderId));
      await emit('ORDER_EMPTY_CART', { orderId, count: result.rowsAffected });
      return result.rowsAffected;
    },

    updateProductItem: async ({
      orderPositionId,
      quantity,
      configuration,
    }: {
      orderPositionId: string;
      configuration: { key: string; value: string }[] | null;
      quantity: number | null;
    }) => {
      const updates: Partial<OrderPosition> = {
        updated: new Date(),
      };

      if (quantity !== null) {
        updates.quantity = quantity;
      }

      if (configuration !== null) {
        updates.configuration = configuration;
      }

      await db.update(orderPositions).set(updates).where(eq(orderPositions._id, orderPositionId));

      const [updatedOrderPosition] = await db
        .select()
        .from(orderPositions)
        .where(eq(orderPositions._id, orderPositionId))
        .limit(1);

      if (!updatedOrderPosition) return null;
      const result = rowToOrderPosition(updatedOrderPosition);
      await emit('ORDER_UPDATE_CART_ITEM', { orderPosition: result });

      return result;
    },

    removeProductByIdFromAllOpenPositions: async (productId: string): Promise<string[]> => {
      // Find positions with this product that are in carts (status = null)
      const positions = await db.all<OrderPosition & { orderId: string }>(
        sql`
        SELECT op.*
        FROM order_positions op
        INNER JOIN orders o ON op.orderId = o._id
        WHERE op.productId = ${productId}
          AND o.status IS NULL
      `,
      );

      const positionIds = positions.map((o) => o._id);
      if (positionIds.length > 0) {
        await db.delete(orderPositions).where(inArray(orderPositions._id, positionIds));
        await Promise.all(
          positions.map(async (orderPosition) => {
            await emit('ORDER_REMOVE_CART_ITEM', { orderPosition });
          }),
        );
      }

      const orderIdsToRecalculate = positions.map((o) => o.orderId);
      return orderIdsToRecalculate;
    },

    updateScheduling: async (orderPositionId: string, scheduling: OrderPositionScheduling[]) => {
      await db.update(orderPositions).set({ scheduling }).where(eq(orderPositions._id, orderPositionId));

      const [updated] = await db
        .select()
        .from(orderPositions)
        .where(eq(orderPositions._id, orderPositionId))
        .limit(1);

      return updated ? rowToOrderPosition(updated) : null;
    },

    updateCalculation: async <T extends PricingCalculation>(
      orderPositionId: string,
      calculation: T[],
    ) => {
      await db
        .update(orderPositions)
        .set({ calculation })
        .where(eq(orderPositions._id, orderPositionId));

      const [updated] = await db
        .select()
        .from(orderPositions)
        .where(eq(orderPositions._id, orderPositionId))
        .limit(1);

      return updated ? rowToOrderPosition(updated) : null;
    },

    addProductItem: async (orderPosition: {
      context?: any;
      configuration?: { key: string; value: string }[] | null;
      orderId: string;
      originalProductId: string;
      productId: string;
      quantity: number;
      quotationId?: string;
    }): Promise<OrderPosition> => {
      const { configuration, orderId, originalProductId, productId, quantity, ...scope } = orderPosition;
      const now = new Date();

      // Serialize configuration for comparison (null-safe)
      const configJson = configuration ? JSON.stringify(configuration) : null;

      // Search for existing position with same attributes
      // Note: We need to compare configuration as JSON since it's stored as JSON
      const existingPositions = await db
        .select()
        .from(orderPositions)
        .where(
          and(
            eq(orderPositions.orderId, orderId),
            eq(orderPositions.productId, productId),
            eq(orderPositions.originalProductId, originalProductId),
          ),
        );

      // Find matching position (including configuration and scope fields)
      const existingPosition = existingPositions.find((pos) => {
        const posConfigJson = pos.configuration ? JSON.stringify(pos.configuration) : null;
        if (posConfigJson !== configJson) return false;

        // Check scope fields (context, quotationId)
        if (scope.quotationId !== undefined && pos.quotationId !== scope.quotationId) return false;
        if (scope.context !== undefined) {
          const posContextJson = pos.context ? JSON.stringify(pos.context) : null;
          const scopeContextJson = scope.context ? JSON.stringify(scope.context) : null;
          if (posContextJson !== scopeContextJson) return false;
        }

        return true;
      });

      if (existingPosition) {
        // Update existing position - increment quantity
        await db
          .update(orderPositions)
          .set({
            quantity: existingPosition.quantity + quantity,
            updated: now,
          })
          .where(eq(orderPositions._id, existingPosition._id));

        const [upsertedOrderPosition] = await db
          .select()
          .from(orderPositions)
          .where(eq(orderPositions._id, existingPosition._id))
          .limit(1);

        const result = rowToOrderPosition(upsertedOrderPosition);
        await emit('ORDER_ADD_PRODUCT', { orderPosition: result });
        return result;
      } else {
        // Insert new position
        const newId = generateId();
        await db.insert(orderPositions).values({
          _id: newId,
          created: now,
          updated: now,
          calculation: [],
          scheduling: [],
          orderId,
          productId,
          originalProductId,
          quantity,
          configuration: configuration ?? null,
          ...scope,
        });

        const [upsertedOrderPosition] = await db
          .select()
          .from(orderPositions)
          .where(eq(orderPositions._id, newId))
          .limit(1);

        const result = rowToOrderPosition(upsertedOrderPosition);
        await emit('ORDER_ADD_PRODUCT', { orderPosition: result });
        return result;
      }
    },

    deleteOrderPositions: async (orderId: string) => {
      const result = await db.delete(orderPositions).where(eq(orderPositions.orderId, orderId));
      return result.rowsAffected;
    },

    getTopProducts: async (
      orderIds: string[],
      options?: { limit?: number },
    ): Promise<TopProductRecord[]> => {
      const limit = options?.limit || 10;

      if (!orderIds.length) return [];

      // SQL query to get top products
      // The calculation array contains items like: [{ category: 'ITEM', amount: 123 }, ...]
      // We need to extract the ITEM category amount from the JSON array
      const rows = await db.all<{
        productId: string;
        totalSold: number;
        totalRevenue: number;
      }>(
        sql.raw(`
        SELECT
          productId,
          SUM(quantity) as totalSold,
          COALESCE(SUM(
            CASE
              WHEN json_valid(calculation) THEN
                (SELECT COALESCE(json_extract(value, '$.amount'), 0)
                 FROM json_each(calculation)
                 WHERE json_extract(value, '$.category') = 'ITEM'
                 LIMIT 1)
              ELSE 0
            END
          ), 0) as totalRevenue
        FROM order_positions
        WHERE orderId IN (${orderIds.map((id) => `'${id}'`).join(',')})
        GROUP BY productId
        HAVING totalSold > 0
        ORDER BY totalSold DESC
        LIMIT ${limit}
      `),
      );

      return rows.map((row) => ({
        productId: row.productId,
        totalSold: Number(row.totalSold),
        totalRevenue: Number(row.totalRevenue),
      }));
    },
  };
};

export type OrderPositionsModule = ReturnType<typeof configureOrderPositionsModule>;
