import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../context.js';
import {
  listProductsHandler,
  ListProductsSchema,
  getProductHandler,
  GetProductSchema,
  createProductHandler,
  CreateProductSchema,
  RemoveProductSchema,
  removeProductHandler,
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
  server.tool('get_product', 'Get detailed product information', GetProductSchema, async (params) =>
    getProductHandler(context, params),
  );

  server.tool('create_product', 'Adds or create new product ', CreateProductSchema, async (params) =>
    createProductHandler(context, params),
  );
  server.tool(
    'remove_product',
    'Removed or deletes a product by its id',
    RemoveProductSchema,
    async (params) => removeProductHandler(context, params),
  );

  return server;
}
