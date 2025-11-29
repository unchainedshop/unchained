import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { productManagement, ProductManagementSchema } from './productManagement.js';

export const registerProductTools = (server: McpServer, context: Context) => {
  server.tool(
    'product_management',
    'Unified product management system with comprehensive action-based operations: CREATE/UPDATE/REMOVE/GET/LIST/COUNT products, UPDATE_STATUS (publish/unpublish), ADD_MEDIA/REMOVE_MEDIA/REORDER_MEDIA/GET_MEDIA/UPDATE_MEDIA_TEXTS, CREATE_VARIATION/REMOVE_VARIATION/ADD_VARIATION_OPTION/REMOVE_VARIATION_OPTION/UPDATE_VARIATION_TEXTS, ADD_ASSIGNMENT/REMOVE_ASSIGNMENT/GET_ASSIGNMENTS/GET_VARIATION_PRODUCTS, ADD_BUNDLE_ITEM/REMOVE_BUNDLE_ITEM/GET_BUNDLE_ITEMS, SIMULATE_PRICE/SIMULATE_PRICE_RANGE/GET_CATALOG_PRICE, GET_PRODUCT_TEXTS/GET_MEDIA_TEXTS/GET_VARIATION_TEXTS, GET_REVIEWS/COUNT_REVIEWS, GET_SIBLINGS. Supports all product types (SIMPLE, CONFIGURABLE, BUNDLE, PLAN, TOKENIZED) with type-specific validations and comprehensive error handling.',
    ProductManagementSchema,
    async (params) => productManagement(context, params),
  );
};
