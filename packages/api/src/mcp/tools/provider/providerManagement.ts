import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { configureProviderMcpModule } from '../../modules/configureProviderMcpModule.js';
import {
  actionValidators,
  ProviderManagementSchema,
  ProviderManagementZodSchema,
  ProviderManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers.js';
import { createMcpErrorResponse, createMcpResponse } from '../../utils/sharedSchemas.js';

export { ProviderManagementSchema, ProviderManagementZodSchema, ProviderManagementParams };

export async function providerManagement(context: Context, params: ProviderManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP providerManagement', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const providerModule = configureProviderMcpModule(context);
    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](providerModule, parsedParams as never);

    return createMcpResponse({
      providerType: actionParams.providerType,
      action,
      data,
    });
  } catch (error) {
    return createMcpErrorResponse(action, error);
  }
}
