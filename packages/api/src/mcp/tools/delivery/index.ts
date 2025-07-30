import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import {
  deliveryProvidersListHandler,
  DeliveryProvidersListSchema,
} from './deliveryProvidersListHandler.js';
import {
  deliveryProvidersCountHandler,
  DeliveryProvidersCountSchema,
} from './deliveryProvidersCountHandler.js';
import { DeliveryProviderByIdSchema, deliveryProviderHandler } from './deliveryProvider.js';
import { deliveryInterfacesHandler, DeliveryInterfacesSchema } from './deliveryInterfacesHandler.js';
import {
  createDeliveryProviderHandler,
  CreateDeliveryProviderSchema,
} from './createDeliveryProviderHandler.js';
import {
  updateDeliveryProviderHandler,
  UpdateDeliveryProviderSchema,
} from './updateDeliveryProviderHandler.js';
import {
  removeDeliveryProviderHandler,
  RemoveDeliveryProviderSchema,
} from './removeDeliveryProviderHandler.js';

export const registerDeliveryProviderTools = (server: McpServer, context: Context) => {
  server.tool(
    'deliveryProviders_list',
    'Get all delivery providers, optionally filtered by type.',
    DeliveryProvidersListSchema,
    async (params) => deliveryProvidersListHandler(context, params),
  );

  server.tool(
    'deliveryProviders_count',
    'Returns total number of delivery providers, optionally filtered by type.',
    DeliveryProvidersCountSchema,
    async (params) => deliveryProvidersCountHandler(context, params),
  );

  server.tool(
    'deliveryProvider_get',
    'Get a specific delivery provider by ID.',
    DeliveryProviderByIdSchema,
    async (params) => deliveryProviderHandler(context, params),
  );
  server.tool(
    'deliveryInterfaces_list',
    'Get all delivery interfaces filtered by type.',
    DeliveryInterfacesSchema,
    async (params) => deliveryInterfacesHandler(context, params),
  );

  server.tool(
    'deliveryProvider_add',
    'Adds new delivery provider.',
    CreateDeliveryProviderSchema,
    async (params) => createDeliveryProviderHandler(context, params),
  );

  server.tool(
    'deliveryProvider_update',
    'Updates the delivery provider specified.',
    UpdateDeliveryProviderSchema,
    async (params) => updateDeliveryProviderHandler(context, params),
  );

  server.tool(
    'deliveryProvider_remove',
    'Soft deletes a delivery provider by setting its deleted timestamp.',
    RemoveDeliveryProviderSchema,
    async (params) => removeDeliveryProviderHandler(context, params),
  );
};
