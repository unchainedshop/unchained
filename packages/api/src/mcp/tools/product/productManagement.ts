import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { configureProductMcpModule } from '../../modules/configureProductMcpModule.js';
import {
  actionValidators,
  ProductManagementSchema,
  ProductManagementZodSchema,
  ProductManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers.js';
import { createMcpErrorResponse, createMcpResponse } from '../../utils/sharedSchemas.js';

export { ProductManagementSchema, ProductManagementZodSchema, ProductManagementParams };

export async function productManagement(context: Context, params: ProductManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP productManagement', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const productModule = configureProductMcpModule(context);
    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](productModule, parsedParams as never);

    return createMcpResponse({
      action,
      data,
    });
  } catch (error) {
    return createMcpErrorResponse(action, error);
  }
}
