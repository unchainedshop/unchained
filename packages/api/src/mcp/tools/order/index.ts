import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { ordersListHandler, OrdersListSchema } from './ordersListHandler.js';
import { getSalesSummaryHandler, SalesSummarySchema } from './getSalesSummaryHandler.js';

export const registerOrderTools = (server: McpServer, context: Context) => {
  server.tool(
    'orders_list',
    'Get all orders, filtered and sorted. Supports pagination, status filters, provider types, and date range.',
    OrdersListSchema,
    async (params) => ordersListHandler(context, params),
  );

  server.tool(
    'ordersSales_summary',
    'Get all orders, filtered and sorted. Supports pagination, status filters, provider types, and date range.',
    SalesSummarySchema,
    async (params) => getSalesSummaryHandler(context, params),
  );
};
