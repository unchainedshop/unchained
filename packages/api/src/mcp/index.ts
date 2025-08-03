import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../context.js';
import { registerOtherTools } from './tools/index.js';
import { registerFilterTools } from './tools/filter/index.js';
import { registerProductTools } from './tools/product/index.js';
import { registerAssortmentTools } from './tools/assortment/index.js';
import { registerCurrencyTools } from './tools/currency/index.js';
import { registerCountryTools } from './tools/country/index.js';
import { registerLanguageTools } from './tools/language/index.js';
import { registerPaymentProviderTools } from './tools/payment/index.js';
import { registerDeliveryProviderTools } from './tools/delivery/index.js';
import { registerWarehousingProviderTools } from './tools/warehousing/index.js';
import { registerOrderTools } from './tools/order/index.js';

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
  registerCurrencyTools(server, context);
  registerCountryTools(server, context);
  registerLanguageTools(server, context);
  registerOtherTools(server, context);
  registerPaymentProviderTools(server, context);
  registerDeliveryProviderTools(server, context);
  registerWarehousingProviderTools(server, context);
  registerOrderTools(server, context);
  return server;
}
