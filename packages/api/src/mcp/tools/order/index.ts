import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../../context.ts';
import { orderManagement, OrderManagementSchema } from './orderManagement.ts';

export const registerOrderTools = (server: McpServer, context: Context) => {
  server.registerTool(
    'order_management',
    {
      description:
        'Unified order management and analytics system. Supports: LIST (get orders with filters and pagination), SALES_SUMMARY (daily sales analytics), MONTHLY_BREAKDOWN (12-month sales analysis), TOP_CUSTOMERS (highest spending customers), TOP_PRODUCTS (best-selling products). All actions support date filtering and provider-based segmentation with proper aggregation and normalization.',
      inputSchema: OrderManagementSchema,
    },
    async (params) => orderManagement(context, params),
  );
};
