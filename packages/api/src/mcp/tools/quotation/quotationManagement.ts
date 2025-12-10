import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  actionValidators,
  QuotationManagementSchema,
  QuotationManagementZodSchema,
  type QuotationManagementParams,
  type ActionName,
} from './schemas.ts';
import actionHandlers from './handlers/index.ts';
import { createMcpResponse, createMcpErrorResponse } from '../../utils/sharedSchemas.ts';

export { QuotationManagementSchema, QuotationManagementZodSchema };
export type { QuotationManagementParams };

export async function quotationManagement(context: Context, params: QuotationManagementParams) {
  const { action, ...actionParams } = params;
  log('MCP handler quotationManagement ', { userId: context.userId, params });

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
