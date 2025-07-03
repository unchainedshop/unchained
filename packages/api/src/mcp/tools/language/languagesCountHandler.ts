import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const LanguagesCountSchema = {
  includeInactive: z.boolean().optional().default(false).describe('Include inactive languages in count'),
  queryString: z.string().optional().describe('Optional search filter'),
};

export const LanguagesCountZodSchema = z.object(LanguagesCountSchema);

export type LanguagesCountParams = z.infer<typeof LanguagesCountZodSchema>;

export async function languagesCountHandler(context: Context, params: LanguagesCountParams) {
  const { modules, userId } = context;

  try {
    log(`handler languagesCountHandler `, {
      userId,
      params,
    });

    const count = await modules.languages.count(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(count),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error counting languages: ${(error as Error).message}`,
        },
      ],
    };
  }
}
