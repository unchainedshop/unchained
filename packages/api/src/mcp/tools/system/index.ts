import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '../../../context.ts';
import { systemManagement } from './systemManagement.ts';
import { SystemManagementSchema } from './schemas.ts';

export const registerSystemTools = (server: McpServer, context: Context) => {
  server.tool(
    'system_management',
    'Comprehensive system management with unified system information, worker queue, and event operations. System actions: SHOP_INFO (returns shop configuration including default locale settings). Worker actions: WORKER_ADD (add work items), WORKER_REMOVE (delete work items), WORKER_GET (retrieve work item), WORKER_LIST (search work items), WORKER_COUNT (count work items), WORKER_ALLOCATE (allocate work to workers), WORKER_FINISH_WORK (mark work complete), WORKER_PROCESS_NEXT (get next work item), WORKER_STATISTICS (work queue statistics), WORKER_ACTIVE_WORK_TYPES (get active work types). Event actions: EVENT_GET (retrieve event), EVENT_LIST (search events), EVENT_COUNT (count events), EVENT_STATISTICS (event analytics).',
    SystemManagementSchema,
    async (params) => systemManagement(context, params),
  );
};
