import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { ordersListHandler, OrdersListSchema } from './ordersListHandler.js';
import { getSalesSummaryHandler, SalesSummarySchema } from './getSalesSummaryHandler.js';
import {
  getMonthlySalesBreakdownHandler,
  MonthlySalesBreakdownSchema,
} from './getMonthlySalesBreakdownHandler.js';

export const registerOrderTools = (server: McpServer, context: Context) => {
  server.tool(
    'orders_list',
    'Get all orders, filtered and sorted. Supports pagination, status filters, provider types, and date range.',
    OrdersListSchema,
    async (params) => ordersListHandler(context, params),
  );

  server.tool(
    'ordersSales_summary',
    'Get aggregate sales analytics including total revenue, order count, average order value, and daily breakdown over a time range.',
    SalesSummarySchema,
    async (params) => getSalesSummaryHandler(context, params),
  );

  server.tool(
    'monthly_sales_breakdown',
    'Get monthly total sales amounts grouped by year and month. Supports filtering by currency, status, providers, and date range.',
    MonthlySalesBreakdownSchema,
    async (params) => getMonthlySalesBreakdownHandler(context, params),
  );
};
