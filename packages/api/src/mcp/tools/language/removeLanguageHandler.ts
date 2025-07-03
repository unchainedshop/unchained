import { z } from 'zod';
import { Context } from '../../../context.js';
import { LanguageNotFoundError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';

export const RemoveLanguageSchema = {
  languageId: z.string().min(1).describe('ID of the language to remove'),
};

export const RemoveLanguageZodSchema = z.object(RemoveLanguageSchema);
export type RemoveLanguageParams = z.infer<typeof RemoveLanguageZodSchema>;

export async function removeLanguageHandler(context: Context, params: RemoveLanguageParams) {
  const { languageId } = params;
  const { modules, userId } = context;

  try {
    log(`handler languagesHandler `, {
      userId,
      params,
    });
    if (!(await modules.languages.languageExists({ languageId })))
      throw new LanguageNotFoundError({ languageId });

    await modules.languages.delete(languageId);

    const removeLanguage = await modules.languages.findLanguage({ languageId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ language: removeLanguage }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error removing language: ${(error as Error).message}`,
        },
      ],
    };
  }
}
