import { z } from 'zod';
import { Context } from '../../../context.js';

const CreateLanguageInputSchema = z.object({
  isoCode: z
    .string()
    .min(2)
    .max(10)
    .describe('Language ISO code, e.g. "en" or "de-CH, accept only valid ISO code"'),
});

export const CreateLanguageSchema = {
  language: CreateLanguageInputSchema,
};

export const CreateLanguageZodSchema = z.object(CreateLanguageSchema);
export type CreateLanguageParams = z.infer<typeof CreateLanguageZodSchema>;

export async function createLanguageHandler(context: Context, params: CreateLanguageParams) {
  const { language } = params;
  const { modules } = context;

  try {
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
