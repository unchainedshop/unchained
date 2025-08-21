import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  ProductManagementSchema,
  ProductManagementZodSchema,
  ProductManagementParams,
  ActionName,
} from './schemas.js';
import { actionHandlers } from './handlers/index.js';
import { createMcpErrorResponse, createMcpResponse } from '../../utils/sharedSchemas.js';

export { ProductManagementSchema, ProductManagementZodSchema, ProductManagementParams };

export async function productManagement(context: Context, params: ProductManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP productManagement', { userId: context.userId, params });

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
