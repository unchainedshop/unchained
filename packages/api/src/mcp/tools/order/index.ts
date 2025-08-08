import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { ordersListHandler, OrdersListSchema } from './ordersListHandler.js';
import { orderAnalytics, OrderAnalyticsSchema } from './orderAnalytics.js';

export const registerOrderTools = (server: McpServer, context: Context) => {
  server.tool(
    'orders_list',
    'Get all orders, filtered and sorted. Supports pagination, status filters, provider types, and date range.',
    OrdersListSchema,
    async (params) => ordersListHandler(context, params),
  );

  server.tool(
    'orders_analytics',
    'Comprehensive order analytics system with unified reporting. Supports: SALES_SUMMARY (daily sales with totals and breakdown), MONTHLY_BREAKDOWN (12-month sales analysis), TOP_CUSTOMERS (highest spending customers with order history), TOP_PRODUCTS (best-selling products by quantity and revenue). All actions support date filtering and provider-based segmentation with proper aggregation and normalization.',
    OrderAnalyticsSchema,
    async (params) => orderAnalytics(context, params),
  );
};
