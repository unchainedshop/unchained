import type { McpServer as McpServerType } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '../context.ts';
import { registerFilterTools } from './tools/filter/index.ts';
import { registerProductTools } from './tools/product/index.ts';
import { registerLocalizationTools } from './tools/localization/index.ts';
import { registerProviderTools } from './tools/provider/index.ts';
import { registerOrderTools } from './tools/order/index.ts';
import { registerQuotationTools } from './tools/quotation/index.ts';
import { registerAssortmentTools } from './tools/assortment/index.ts';
import { registerUsersTools } from './tools/users/index.ts';
import { registerSystemTools } from './tools/system/index.ts';
import { registerLocalizationResources } from './resources/localization.ts';

export default function createMcpServer(server: McpServerType, context: Context, roles) {
  if (!roles?.includes('admin')) {
    return server;
  }

  registerLocalizationResources(server, context);
  registerFilterTools(server, context);
  registerProductTools(server, context);
  registerAssortmentTools(server, context);
  registerLocalizationTools(server, context);
  registerSystemTools(server, context);
  registerProviderTools(server, context);
  registerOrderTools(server, context);
  registerQuotationTools(server, context);
  registerUsersTools(server, context);

  return server;
}
