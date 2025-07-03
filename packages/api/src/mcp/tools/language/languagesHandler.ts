import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';
import { log } from '@unchainedshop/logger';

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const ListLanguagesSchema = {
  limit: z.number().int().min(1).max(100).default(50).describe('Maximum number of languages to return'),
  offset: z.number().int().min(0).default(0).describe('Number of languages to skip for pagination'),
  includeInactive: z.boolean().default(false).describe('Whether to include inactive languages'),
  query_string: z.string().min(1).optional().describe('Optional text search filter'),
  sort: z
    .array(
      z.object({
        key: z.string().min(1).describe('Field to sort by'),
        value: z.enum(sortDirectionKeys).describe("Sort direction, 'ASC' or 'DESC'"),
      }),
    )
    .optional()
    .describe('Sort configuration'),
};

export const ListLanguagesZodSchema = z.object(ListLanguagesSchema);

export type ListLanguagesParams = z.infer<typeof ListLanguagesZodSchema>;

export async function languagesHandler(context: Context, params: ListLanguagesParams) {
  const { modules, userId } = context;

  try {
    log(`handler languagesHandler `, {
      userId,
      params,
    });
    const languages = await modules.languages.findLanguages(params as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ languages }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving languages: ${(error as Error).message}`,
        },
      ],
    };
  }
}
