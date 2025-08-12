import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { workerManagement } from './workerManagement.js';
import { WorkerManagementSchema } from './schemas.js';

export const registerWorkerTools = (server: McpServer, context: Context) => {
  server.tool(
    'worker_management',
    'Comprehensive worker queue management system with unified CRUD operations. Supports: ADD (new work items), REMOVE (delete work items), GET (retrieve single work item), LIST (paginated search with sorting), COUNT (total counts), ALLOCATE (allocate work to workers), FINISH_WORK (mark work as complete), PROCESS_NEXT (get next work item), STATISTICS (work queue statistics), ACTIVE_WORK_TYPES (currently active work items in the system).  Action-based routing with proper validation and error handling.',
    WorkerManagementSchema,
    async (params) => workerManagement(context, params),
  );
};
