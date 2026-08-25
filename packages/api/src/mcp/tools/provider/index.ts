import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../../context.ts';
import { providerManagement, ProviderManagementSchema } from './providerManagement.ts';

export const registerProviderTools = (server: McpServer, context: Context) => {
  server.registerTool(
    'provider_management',
    {
      description:
        'Unified provider management tool for all provider operations (CREATE, UPDATE, REMOVE, GET, LIST, INTERFACES) across payment processing (Stripe, PayPal), delivery services (FedEx, UPS), and warehousing systems. Use action parameter to specify operation type.',
      inputSchema: ProviderManagementSchema,
    },
    async (params) => providerManagement(context, params),
  );
};
