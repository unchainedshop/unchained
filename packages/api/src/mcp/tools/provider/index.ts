import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '../../../context.ts';
import { providerManagement, ProviderManagementSchema } from './providerManagement.ts';

export const registerProviderTools = (server: McpServer, context: Context) => {
  server.tool(
    'provider_management',
    'Unified provider management tool for all provider operations (CREATE, UPDATE, REMOVE, GET, LIST, INTERFACES) across payment processing (Stripe, PayPal), delivery services (FedEx, UPS), and warehousing systems. Use action parameter to specify operation type.',
    ProviderManagementSchema,
    async (params) => providerManagement(context, params),
  );
};
