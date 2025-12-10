import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  FilterManagementSchema,
  FilterManagementZodSchema,
  type FilterManagementParams,
  type ActionName,
} from './schemas.ts';
import actionHandlers from './handlers/index.ts';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.ts';

export { FilterManagementSchema, FilterManagementZodSchema };
export type { FilterManagementParams };

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
