import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { createProvider, CreateProviderSchema } from './createProvider.js';
import { updateProvider, UpdateProviderSchema } from './updateProvider.js';
import { removeProvider, RemoveProviderSchema } from './removeProvider.js';
import { getProvider, GetProviderSchema } from './getProvider.js';
import { listProviders, ListProvidersSchema } from './listProviders.js';
import { getProviderInterfaces, GetProviderInterfacesSchema } from './getProviderInterfaces.js';

export const registerProviderTools = (server: McpServer, context: Context) => {
  server.tool(
    'provider_create',
    'Create a new provider for payment processing (Stripe, PayPal), delivery services (FedEx, UPS), or warehousing systems. Requires providerType (PAYMENT/DELIVERY/WAREHOUSING), specific subtype, and adapterKey from available interfaces. Provider is initialized with adapter default configuration.',
    CreateProviderSchema,
    async (params) => createProvider(context, params),
  );

  server.tool(
    'provider_update',
    'Update configuration parameters of an existing provider instance. Only the configuration object can be modified - use key-value pairs specific to the provider adapter (e.g., apiKey, webhookUrl, sandbox mode). Get current config from provider_get first.',
    UpdateProviderSchema,
    async (params) => updateProvider(context, params),
  );

  server.tool(
    'provider_remove',
    'Soft delete a provider instance by its ID and type. The provider is marked as deleted and becomes unavailable for new transactions but existing data is preserved. Use provider_list to find provider IDs.',
    RemoveProviderSchema,
    async (params) => removeProvider(context, params),
  );

  server.tool(
    'provider_get',
    'Retrieve detailed information about a specific provider instance including its configuration, adapter details, and current status. Use provider_list to find available provider IDs first.',
    GetProviderSchema,
    async (params) => getProvider(context, params),
  );

  server.tool(
    'provider_list',
    'List all providers of a specific type (PAYMENT/DELIVERY/WAREHOUSING) with optional filtering by subtype (CARD/INVOICE for payments, PICKUP/SHIPPING for delivery, etc.) and search by ID or adapter key. Returns basic provider info.',
    ListProvidersSchema,
    async (params) => listProviders(context, params),
  );

  server.tool(
    'provider_interfaces',
    'Get all available adapter interfaces for a provider type showing adapter keys, names, versions, default configurations, and activation status. Optionally filter by provider subtype (CARD/INVOICE for payments, PICKUP/SHIPPING for delivery, etc.) to see only relevant adapters. Use this before creating providers to see available options.',
    GetProviderInterfacesSchema,
    async (params) => getProviderInterfaces(context, params),
  );
};
