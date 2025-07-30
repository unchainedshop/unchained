import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import {
  paymentProvidersListHandler,
  PaymentProvidersListSchema,
} from './paymentProvidersListHandler.js';
import {
  paymentProvidersCountHandler,
  PaymentProvidersCountSchema,
} from './paymentProvidersCountHandler.js';
import { paymentProviderByIdHandler, PaymentProviderByIdSchema } from './paymentProviderByIdHandler.js';
import { paymentInterfacesHandler, PaymentInterfacesSchema } from './paymentInterfacesHandler.js';
import {
  createPaymentProviderHandler,
  CreatePaymentProviderSchema,
} from './createPaymentProviderHandler.js';
import {
  updatePaymentProviderHandler,
  UpdatePaymentProviderSchema,
} from './updatePaymentProviderHandler.js';
import {
  removePaymentProviderHandler,
  RemovePaymentProviderSchema,
} from './removePaymentProviderHandler.js';

export const registerPaymentProviderTools = (server: McpServer, context: Context) => {
  server.tool(
    'paymentProviders_list',
    'Get all payment providers, optionally filtered by type.',
    PaymentProvidersListSchema,
    async (params) => paymentProvidersListHandler(context, params),
  );
  server.tool(
    'paymentProviders_count',
    'Returns total number of payment providers, optionally filtered by type.',
    PaymentProvidersCountSchema,
    async (params) => paymentProvidersCountHandler(context, params),
  );

  server.tool(
    'paymentProvider_get',
    'Get a specific payment provider by ID.',
    PaymentProviderByIdSchema,
    async (params) => paymentProviderByIdHandler(context, params),
  );

  server.tool(
    'paymentInterfaces_list',
    'Get all payment interfaces filtered by type.',
    PaymentInterfacesSchema,
    async (params) => paymentInterfacesHandler(context, params),
  );
  server.tool(
    'paymentProvider_add',
    'Adds new payment provider.',
    CreatePaymentProviderSchema,
    async (params) => createPaymentProviderHandler(context, params),
  );

  server.tool(
    'paymentProvider_update',
    'Updates payment provider information with the provided ID.',
    UpdatePaymentProviderSchema,
    async (params) => updatePaymentProviderHandler(context, params),
  );

  server.tool(
    'paymentProvider_remove',
    'Soft deletes a payment provider by setting its deleted timestamp.',
    RemovePaymentProviderSchema,
    async (params) => removePaymentProviderHandler(context, params),
  );
};
