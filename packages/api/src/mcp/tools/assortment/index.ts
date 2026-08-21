import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../../context.ts';
import { assortmentManagement, AssortmentManagementSchema } from './assortmentManagement.ts';

export const registerAssortmentTools = (server: McpServer, context: Context) => {
  server.registerTool(
    'assortment_management',
    {
      description:
        'Unified assortment management system with comprehensive action-based operations: CREATE/UPDATE/REMOVE/GET/LIST/COUNT assortments, UPDATE_STATUS (activate/deactivate), ADD_MEDIA/REMOVE_MEDIA/REORDER_MEDIA/GET_MEDIA/UPDATE_MEDIA_TEXTS, ADD_PRODUCT/REMOVE_PRODUCT/GET_PRODUCTS/REORDER_PRODUCTS, ADD_FILTER/REMOVE_FILTER/GET_FILTERS/REORDER_FILTERS, ADD_LINK/REMOVE_LINK/GET_LINKS/REORDER_LINKS, GET_CHILDREN/SET_BASE, SEARCH_PRODUCTS, GET_TEXTS/GET_MEDIA_TEXTS. Supports comprehensive assortment management with type-specific validations and error handling.',
      inputSchema: AssortmentManagementSchema,
    },
    async (params) => assortmentManagement(context, params),
  );
};
