import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { filterManagement, FilterManagementSchema } from './filterManagement.js';

export const registerFilterTools = (server: McpServer, context: Context) => {
  server.tool(
    'filter_manage',
    'Comprehensive filter management system with unified CRUD operations. Supports: CREATE (new filters with localized texts), UPDATE (modify filter properties), REMOVE (delete with assortment cleanup), GET (retrieve single filter), LIST (paginated search with sorting), COUNT (total counts), CREATE_OPTION/REMOVE_OPTION (manage filter options), UPDATE_TEXTS/GET_TEXTS (localization management). Action-based routing with proper validation and error handling.',
    FilterManagementSchema,
    async (params) => filterManagement(context, params),
  );
};
