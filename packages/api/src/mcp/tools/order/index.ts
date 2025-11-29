import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { orderManagement, OrderManagementSchema } from './orderManagement.js';

export const registerOrderTools = (server: McpServer, context: Context) => {
  server.tool(
    'order_management',
    'Unified order management and analytics system. Supports: LIST (get orders with filters and pagination), SALES_SUMMARY (daily sales analytics), MONTHLY_BREAKDOWN (12-month sales analysis), TOP_CUSTOMERS (highest spending customers), TOP_PRODUCTS (best-selling products). All actions support date filtering and provider-based segmentation with proper aggregation and normalization.',
    OrderManagementSchema,
    async (params) => orderManagement(context, params),
  );
};
