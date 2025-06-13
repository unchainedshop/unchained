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
  PublishProductSchema,
  publishProductHandler,
  UnpublishProductSchema,
  unpublishProductHandler,
  UpdateProductSchema,
  updateProductHandler,
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

  server.tool(
    'create_product',
    'Adds or create new product the product will be in DRAFT/unpublish status',
    CreateProductSchema,
    async (params) => createProductHandler(context, params),
  );
  server.tool(
    'remove_product',
    'Removed or deletes a product by its id changing its status to DELETED and removing it from sale',
    RemoveProductSchema,
    async (params) => removeProductHandler(context, params),
  );

  server.tool(
    'publish_product',
    'Publish a product by its id changing it to active and available for sale',
    PublishProductSchema,
    async (params) => publishProductHandler(context, params),
  );

  server.tool(
    'unpublish_product',
    'Deactivates or Unpublishes product by its id changing it to DRAFT and not available for sale',
    UnpublishProductSchema,
    async (params) => unpublishProductHandler(context, params),
  );
  server.tool(
    'update_product',
    'Modify/Update generic infos of a product (tags for ex.)',
    UpdateProductSchema,
    async (params) => updateProductHandler(context, params),
  );

  return server;
}
