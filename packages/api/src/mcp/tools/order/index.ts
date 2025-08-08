import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { ordersListHandler, OrdersListSchema } from './ordersListHandler.js';
import { getSalesSummaryHandler, SalesSummarySchema } from './getSalesSummaryHandler.js';
import {
  getMonthlySalesBreakdownHandler,
  MonthlySalesBreakdownSchema,
} from './getMonthlySalesBreakdownHandler.js';
import { getTopCustomersHandler, GetTopCustomersSchema } from './getTopCustomersHandler.js';
import {
  getTopSellingProductsHandler,
  TopSellingProductsSchema,
} from './getTopSellingProductsHandler.js';

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
    'ordersSales_monthlyBreakdown',
    'Break down total sales by month. Supports filtering by status and provider IDs, with optional custom date range.',
    MonthlySalesBreakdownSchema,
    async (params) => getMonthlySalesBreakdownHandler(context, params),
  );

  server.tool(
    'orders_topCustomers',
    'Get top customers by total amount spent, with optional date and status filters.',
    GetTopCustomersSchema,
    async (params) => getTopCustomersHandler(context, params),
  );

  server.tool(
    'topSelling_products',
    'Get top-selling products by quantity and revenue within an optional date range.',
    TopSellingProductsSchema,
    (params) => getTopSellingProductsHandler(context, params),
  );
};
