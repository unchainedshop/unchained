import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  FilterManagementSchema,
  FilterManagementZodSchema,
  FilterManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers/index.js';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.js';

export { FilterManagementSchema, FilterManagementZodSchema, FilterManagementParams };

export async function filterManagement(context: Context, params: FilterManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP handler filterManagement ', { userId: context.userId, params });

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
