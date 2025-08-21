import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  OrderManagementSchema,
  OrderManagementZodSchema,
  OrderManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers/index.js';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.js';

export { OrderManagementSchema, OrderManagementZodSchema, OrderManagementParams };

export async function orderManagement(context: Context, params: OrderManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP handler orderManagement ', { userId: context.userId, params });

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
