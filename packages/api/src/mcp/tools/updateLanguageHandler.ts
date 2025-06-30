import { z } from 'zod';
import { Context } from '../../context.js';
import { LanguageNotFoundError } from '../../errors.js';

const UpdateLanguageInputSchema = z.object({
  isoCode: z.string().min(2).max(10).describe('Updated ISO code for the language'),
  isActive: z.boolean().optional().describe('Whether the language is active'),
});

export const UpdateLanguageSchema = {
  languageId: z.string().min(1).describe('ID of the language to update'),
  language: UpdateLanguageInputSchema,
};

export const UpdateLanguageZodSchema = z.object(UpdateLanguageSchema);
export type UpdateLanguageParams = z.infer<typeof UpdateLanguageZodSchema>;

export async function updateLanguageHandler(context: Context, params: UpdateLanguageParams) {
  const { languageId, language } = params;
  const { modules } = context;

  try {
    if (!(await modules.languages.languageExists({ languageId })))
      throw new LanguageNotFoundError({ languageId });

    await modules.languages.update(languageId, language);

    const updatedLanguage = await modules.languages.findLanguage({ languageId });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ language: updatedLanguage }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating language: ${(error as Error).message}`,
        },
      ],
    };
  }
}
