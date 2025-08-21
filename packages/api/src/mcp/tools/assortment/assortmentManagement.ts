import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  AssortmentManagementSchema,
  AssortmentManagementZodSchema,
  AssortmentManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers/index.js';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.js';

export { AssortmentManagementSchema, AssortmentManagementZodSchema, AssortmentManagementParams };

export async function assortmentManagement(context: Context, params: AssortmentManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP assortmentManagement', { userId: context.userId, params });

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
