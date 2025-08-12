import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { systemManagement } from './systemManagement.js';
import { SystemManagementSchema } from './schemas.js';

export const registerSystemTools = (server: McpServer, context: Context) => {
  server.tool(
    'system_management',
    'Comprehensive system management with unified system information, worker queue, and event operations. System actions: SHOP_INFO (get shop configuration defaults including country, language, currency, and locale). Worker actions: WORKER_ADD (add work items), WORKER_REMOVE (delete work items), WORKER_GET (retrieve work item), WORKER_LIST (search work items), WORKER_COUNT (count work items), WORKER_ALLOCATE (allocate work to workers), WORKER_FINISH_WORK (mark work complete), WORKER_PROCESS_NEXT (get next work item), WORKER_STATISTICS (work queue statistics), WORKER_ACTIVE_WORK_TYPES (get active work types). Event actions: EVENT_GET (retrieve event), EVENT_LIST (search events), EVENT_COUNT (count events), EVENT_STATISTICS (event analytics). Action-based routing with proper validation and error handling for system information, worker queue management, and event system access.',
    SystemManagementSchema,
    async (params) => systemManagement(context, params),
  );
};
