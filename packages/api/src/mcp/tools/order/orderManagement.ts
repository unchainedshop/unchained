import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { configureOrderMcpModule } from '../../modules/configureOrderMcpModule.js';
import {
  actionValidators,
  OrderManagementSchema,
  OrderManagementZodSchema,
  OrderManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers.js';

export { OrderManagementSchema, OrderManagementZodSchema, OrderManagementParams };

export async function orderManagement(context: Context, params: OrderManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP handler orderManagement ', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const orderModule = configureOrderMcpModule(context);
    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](orderModule, parsedParams as never);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            action,
            data,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error in order ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
