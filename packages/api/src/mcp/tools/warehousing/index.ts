import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import {
  warehousingProvidersListHandler,
  WarehousingProvidersListSchema,
} from './warehousingProvidersListHandler.js';
import {
  warehousingProvidersCountHandler,
  WarehousingProvidersCountSchema,
} from './warehousingProvidersCountHandler.js';
import {
  WarehousingProviderByIdSchema,
  warehousingProviderHandler,
} from './warehousingProviderHandler.js';
import {
  warehousingInterfacesHandler,
  WarehousingInterfacesSchema,
} from './warehousingInterfacesHandler.js';
import {
  createWarehousingProviderHandler,
  CreateWarehousingProviderSchema,
} from './createWarehousingProviderHandler.js';
import {
  updateWarehousingProviderHandler,
  UpdateWarehousingProviderSchema,
} from './updateWarehousingProviderHandler.js';
import {
  removeWarehousingProviderHandler,
  RemoveWarehousingProviderSchema,
} from './removeWarehousingProviderHandler.js';

export const registerWarehousingProviderTools = (server: McpServer, context: Context) => {
  server.tool(
    'warehousingProviders_list',
    'Get all warehousing providers, optionally filtered by type.',
    WarehousingProvidersListSchema,
    async (params) => warehousingProvidersListHandler(context, params),
  );

  server.tool(
    'warehousingProviders_count',
    'Returns total number of warehousing providers, optionally filtered by type.',
    WarehousingProvidersCountSchema,
    async (params) => warehousingProvidersCountHandler(context, params),
  );

  server.tool(
    'warehousingProvider_get',
    'Get a specific warehousing provider by ID.',
    WarehousingProviderByIdSchema,
    async (params) => warehousingProviderHandler(context, params),
  );

  server.tool(
    'warehousingInterfaces_list',
    'Get all warehousing interfaces filtered by type.',
    WarehousingInterfacesSchema,
    async (params) => warehousingInterfacesHandler(context, params),
  );

  server.tool(
    'warehousingProvider_add',
    'Creates new warehousing provider.',
    CreateWarehousingProviderSchema,
    async (params) => createWarehousingProviderHandler(context, params),
  );

  server.tool(
    'warehousingProvider_update',
    'Updates warehousing provider information with the provided ID.',
    UpdateWarehousingProviderSchema,
    async (params) => updateWarehousingProviderHandler(context, params),
  );

  server.tool(
    'warehousingProvider_remove',
    'Soft deletes a warehousing provider by setting its deleted timestamp.',
    RemoveWarehousingProviderSchema,
    async (params) => removeWarehousingProviderHandler(context, params),
  );
};
