import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  ProviderManagementSchema,
  ProviderManagementZodSchema,
  type ProviderManagementParams,
  type ActionName,
} from './schemas.ts';
import actionHandlers from './handlers/index.ts';
import { createMcpErrorResponse, createMcpResponse } from '../../utils/sharedSchemas.ts';

export { ProviderManagementSchema, ProviderManagementZodSchema };
export type { ProviderManagementParams };

export async function providerManagement(context: Context, params: ProviderManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP providerManagement', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](context, parsedParams as never);

    return createMcpResponse({
      action,
      data,
      providerType: params?.providerType,
    });
  } catch (error) {
    return createMcpErrorResponse(action, error);
  }
}
