import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const LanguageSchema = {
  languageId: z.string().min(1).describe('The ID of the language to fetch'),
};

export const LanguageZodSchema = z.object(LanguageSchema);

export type LanguageParams = z.infer<typeof LanguageZodSchema>;

export async function languageHandler(context: Context, params: LanguageParams) {
  const { languageId } = params;
  const { modules, userId } = context;

  try {
    log(`handler languageHandler`, { userId, params });
    const language = await modules.languages.findLanguage({ languageId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ language }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving language: ${(error as Error).message}`,
        },
      ],
    };
  }
}
