import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '../../../context.ts';
import { filterManagement, FilterManagementSchema } from './filterManagement.ts';

export const registerFilterTools = (server: McpServer, context: Context) => {
  server.registerTool(
    'filter_management',
    {
      description:
        'Comprehensive filter management system with unified CRUD operations. Supports: CREATE (new filters with localized texts), UPDATE (modify filter properties), REMOVE (delete with assortment cleanup), GET (retrieve single filter), LIST (paginated search with sorting), COUNT (total counts), CREATE_OPTION/REMOVE_OPTION (manage filter options), UPDATE_TEXTS/GET_TEXTS (localization management). Action-based routing with proper validation and error handling.',
      inputSchema: FilterManagementSchema,
    },
    async (params) => filterManagement(context, params),
  );
};
