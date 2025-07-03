import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const CreateLanguageInputSchema = z.object({
  isoCode: z
    .string()
    .min(2)
    .max(10)
    .describe(
      'Language ISO code (e.g., "en" or "de-CH"). Must follow ISO 639-1 and ISO 3166-1 formats.',
    ),
});

export const CreateLanguageSchema = {
  language: CreateLanguageInputSchema,
};

export const CreateLanguageZodSchema = z.object(CreateLanguageSchema);
export type CreateLanguageParams = z.infer<typeof CreateLanguageZodSchema>;

export async function createLanguageHandler(context: Context, params: CreateLanguageParams) {
  const { language } = params;
  const { modules, userId } = context;

  try {
    log(`handler createLanguageHandler`, { userId, params });
    const languageId = await modules.languages.create(language as any);

    const newLanguage = await modules.languages.findLanguage({ languageId });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ language: newLanguage }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error creating language: ${(error as Error).message}`,
        },
      ],
    };
  }
}
