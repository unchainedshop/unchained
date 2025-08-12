import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../context.js';
import { registerOtherTools } from './tools/index.js';
import { registerFilterTools } from './tools/filter/index.js';
import { registerProductTools } from './tools/product/index.js';

import { registerLocalizationTools } from './tools/localization/index.js';
import { registerProviderTools } from './tools/provider/index.js';
import { registerOrderTools } from './tools/order/index.js';
import { registerAssortmentTools } from './tools/assortment/index.js';

export default function createMcpServer(context: Context, roles) {
  const server = new McpServer({
    name: 'Unchained MCP Server',
    version: '1.0.0',
  });

  if (!roles?.includes('admin')) {
    return server;
  }
  registerFilterTools(server, context);
  registerProductTools(server, context);
  registerAssortmentTools(server, context);
  registerLocalizationTools(server, context);
  registerOtherTools(server, context); // This now includes the unified system management (worker + events + shopInfo)
  registerProviderTools(server, context);
  registerOrderTools(server, context);
  return server;
}
