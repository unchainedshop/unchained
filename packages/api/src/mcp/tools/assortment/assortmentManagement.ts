import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { configureAssortmentMcpModule } from '../../modules/configureAssortmentMcpModule.js';
import {
  actionValidators,
  AssortmentManagementSchema,
  AssortmentManagementZodSchema,
  AssortmentManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers.js';

export { AssortmentManagementSchema, AssortmentManagementZodSchema, AssortmentManagementParams };

export async function assortmentManagement(context: Context, params: AssortmentManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP assortmentManagement', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const assortmentModule = configureAssortmentMcpModule(context);
    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](assortmentModule, parsedParams as never);

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
          text: `Error in assortment ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
