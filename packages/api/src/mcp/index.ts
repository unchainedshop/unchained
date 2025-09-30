import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../context.js';
import { registerFilterTools } from './tools/filter/index.js';
import { registerProductTools } from './tools/product/index.js';

import { registerLocalizationTools } from './tools/localization/index.js';
import { registerProviderTools } from './tools/provider/index.js';
import { registerOrderTools } from './tools/order/index.js';
import { registerAssortmentTools } from './tools/assortment/index.js';
import { registerUsersTools } from './tools/users/index.js';
import { registerSystemTools } from './tools/system/index.js';
import { registerLocalizationResources } from './resources/localization.js';

export default function createMcpServer(context: Context, roles) {
  const server = new McpServer({
    name: 'Unchained MCP Server',
    version: '1.0.0',
  });

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
  registerUsersTools(server, context);
  return server;
}
