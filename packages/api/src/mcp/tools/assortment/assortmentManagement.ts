import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  AssortmentManagementSchema,
  AssortmentManagementZodSchema,
  type AssortmentManagementParams,
  type ActionName,
} from './schemas.ts';
import actionHandlers from './handlers/index.ts';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.ts';

export { AssortmentManagementSchema, AssortmentManagementZodSchema };
export type { AssortmentManagementParams };

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
