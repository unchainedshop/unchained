import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { configureUsersMcpModule } from '../../modules/configureUsersMcpModule.js';
import {
  actionValidators,
  UsersManagementSchema,
  UsersManagementZodSchema,
  UsersManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers.js';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.js';

export { UsersManagementSchema, UsersManagementZodSchema, UsersManagementParams };

export async function usersManagement(context: Context, params: UsersManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP handler usersManagement ', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const usersModule = configureUsersMcpModule(context);
    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](usersModule, parsedParams as never);

    return createMcpResponse({
      action,
      data,
    });
  } catch (error) {
    return createMcpErrorResponse(action, error);
  }
}
