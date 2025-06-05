import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../context.js';
import {
  listProductsHandler,
  ListProductsSchema,
  getProductHandler,
  GetProductSchema,
} from './tools/index.js';

export default function createMcpServer(context: Context) {
  const server = new McpServer({
    name: 'Unchained MCP Server',
    version: '1.0.0',
  });

  server.tool(
    'list_products',
    'Search and list products with comprehensive filtering and pagination support',
    ListProductsSchema,
    async (params) => listProductsHandler(context, params),
  );

  server.tool(
    'get_product',
    'Get detailed product information with rich visualization',
    GetProductSchema,
    async (params) => getProductHandler(context, params),
  );

  return server;
}
