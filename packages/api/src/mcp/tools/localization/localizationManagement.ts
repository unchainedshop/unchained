import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  LocalizationManagementSchema,
  LocalizationManagementZodSchema,
  type LocalizationManagementParams,
  type ActionName,
} from './schemas.ts';
import actionHandlers from './handlers/index.ts';
import { createMcpErrorResponse, createMcpResponse } from '../../utils/sharedSchemas.ts';

export { LocalizationManagementSchema, LocalizationManagementZodSchema };
export type { LocalizationManagementParams };

export async function localizationManagement(context: Context, params: LocalizationManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP localizationManagement', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](context, parsedParams as never);

    return createMcpResponse({
      action,
      data,
      localizationType: actionParams.localizationType,
    });
  } catch (error) {
    return createMcpErrorResponse(action, error);
  }
}
