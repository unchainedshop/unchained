import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  WorkerManagementSchema,
  WorkerManagementZodSchema,
  WorkerManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers.js';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.js';
import { configureWorkerMcpModule } from '../../modules/configureWorkerMcpModule.js';

export { WorkerManagementSchema, WorkerManagementZodSchema, WorkerManagementParams };

export async function workerManagement(context: Context, params: WorkerManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP handler workerManagement ', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const workerModule = configureWorkerMcpModule(context);
    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](workerModule, parsedParams as never);

    return createMcpResponse({
      action,
      data,
    });
  } catch (error) {
    return createMcpErrorResponse(action, error);
  }
}
