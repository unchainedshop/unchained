import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const ListLanguagesSchema = {
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  includeInactive: z.boolean().default(false),
  queryString: z.string().min(1).optional(),
  sort: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.enum(sortDirectionKeys).describe("Sort direction, e.g., 'ASC' or 'DESC'"),
      }),
    )
    .optional(),
};

export const ListLanguagesZodSchema = z.object(ListLanguagesSchema);

export type ListLanguagesParams = z.infer<typeof ListLanguagesZodSchema>;

export async function languagesHandler(context: Context, params: ListLanguagesParams) {
  const { sort, ...restParams } = params;
  const { modules } = context;

  try {
    const languages = await modules.languages.findLanguages({ ...restParams, sort: sort as any[] });

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
