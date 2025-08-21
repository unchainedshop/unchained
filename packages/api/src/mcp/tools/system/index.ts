import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { systemManagement } from './systemManagement.js';
import { SystemManagementSchema } from './schemas.js';

export const registerSystemTools = (server: McpServer, context: Context) => {
  server.tool(
    'system_management',
    'Comprehensive system management with unified system information, worker queue, and event operations. CRITICAL INSTRUCTION: When any operation requires locale, language, country, or currency information that is not provided by the user or cannot be derived from context, you MUST first call this tool with action "SHOP_INFO" to retrieve the authoritative default values, then use those defaults in subsequent operations. System actions: SHOP_INFO (MANDATORY first call when defaults needed - returns shop configuration including defaultLanguageIsoCode for language/locale fallback, country_isoCode for country fallback, and country_defaultCurrency for currency fallback). Worker actions: WORKER_ADD (add work items), WORKER_REMOVE (delete work items), WORKER_GET (retrieve work item), WORKER_LIST (search work items), WORKER_COUNT (count work items), WORKER_ALLOCATE (allocate work to workers), WORKER_FINISH_WORK (mark work complete), WORKER_PROCESS_NEXT (get next work item), WORKER_STATISTICS (work queue statistics), WORKER_ACTIVE_WORK_TYPES (get active work types). Event actions: EVENT_GET (retrieve event), EVENT_LIST (search events), EVENT_COUNT (count events), EVENT_STATISTICS (event analytics). FALLBACK BEHAVIOR: Always call SHOP_INFO first when user requests lack locale/language/country/currency context to ensure consistent default behavior. Use defaultLanguageIsoCode for missing language/locale, country_isoCode for missing country, country_defaultCurrency for missing currency.',
    SystemManagementSchema,
    async (params) => systemManagement(context, params),
  );
};
