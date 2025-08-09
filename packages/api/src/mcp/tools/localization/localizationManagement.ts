import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { configureLocalizationMcpModule } from '../../modules/configureLocalizationMcpModule.js';
import {
  actionValidators,
  LocalizationManagementSchema,
  LocalizationManagementZodSchema,
  LocalizationManagementParams,
  ActionName,
} from './schemas.js';
import actionHandlers from './handlers.js';

export { LocalizationManagementSchema, LocalizationManagementZodSchema, LocalizationManagementParams };

export async function localizationManagement(context: Context, params: LocalizationManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP localizationManagement', { userId: context.userId, params });

  try {
    if (!(action in actionHandlers)) {
      throw new Error(`Unknown action: ${action}`);
    }

    const localizationModule = configureLocalizationMcpModule(context);
    const parsedParams = actionValidators[action as ActionName].parse(actionParams);
    const data = await actionHandlers[action as ActionName](localizationModule, parsedParams as never);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            action,
            localizationType: parsedParams.localizationType,
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
          text: `Error in localization ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
