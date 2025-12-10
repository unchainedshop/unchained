import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { actionValidators, type ActionName, type SystemManagementParams } from './schemas.ts';
import actionHandlers from './handlers/index.ts';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.ts';

export async function systemManagement(context: Context, params: SystemManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP handler systemManagement ', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](context, parsedParams as never);

    return createMcpResponse({
      action,
      data,
    });
  } catch (error) {
    return createMcpErrorResponse(action, error);
  }
}

export { SystemManagementSchema, SystemManagementZodSchema } from './schemas.ts';
export type { SystemManagementParams } from './schemas.ts';
