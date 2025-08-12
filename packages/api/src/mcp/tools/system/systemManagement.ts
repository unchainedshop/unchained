import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { actionValidators, ActionName, SystemManagementParams } from './schemas.js';
import actionHandlers from './handlers.js';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.js';
import { configureSystemMcpModule } from '../../modules/configureSystemMcpModule.js';

export async function systemManagement(context: Context, params: SystemManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP handler systemManagement ', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const systemModule = configureSystemMcpModule(context);

    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](systemModule, parsedParams as never);

    return createMcpResponse({
      action,
      data,
    });
  } catch (error) {
    return createMcpErrorResponse(action, error);
  }
}

export { SystemManagementSchema, SystemManagementZodSchema, SystemManagementParams } from './schemas.js';
