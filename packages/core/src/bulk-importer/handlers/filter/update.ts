import { z } from 'zod';
import createFilter from './create.js';
import { Modules } from '../../../modules.js';

export const LocalizedContentSchema = z.record(
  z.string(), // locale
  z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }),
);
export const FilterUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: z.object({
    type: z.string(),
    key: z.string(),
    isActive: z.boolean().optional(),
    options: z
      .array(
        z.object({
          value: z.string(),
          content: LocalizedContentSchema.optional(),
        }),
      )
      .optional(),
    meta: z.record(z.any(), z.any()).optional(),
    content: LocalizedContentSchema,
  }),
});

export default async function updateFilter(
  payload: any,
  { logger, updateShouldUpsertIfIDNotExists }: { logger: any; updateShouldUpsertIfIDNotExists: boolean },
  unchainedAPI: { modules: Modules },
) {
  const { modules } = unchainedAPI;
  const { specification, _id } = payload;

  if (!(await modules.filters.filterExists({ filterId: _id }))) {
    if (updateShouldUpsertIfIDNotExists) {
      return createFilter(payload, { logger, createShouldUpsertIfIDExists: false }, unchainedAPI);
    }
    throw new Error(`Can't update non-existing filter ${_id}`);
  }

  const { content, options, ...filterData } = specification;

  if (specification) {
    logger.debug('update filter object', specification);
    await modules.filters.update(_id, {
      ...filterData,
      options: options?.map((option) => option.value) || [],
    });
  }

  if (content) {
    logger.debug('replace localized content for filter', content);
    await modules.filters.texts.updateTexts(
      { filterId: _id },
      Object.entries(content).map(([locale, localizedData]: [string, any]) => {
        return {
          locale,
          ...localizedData,
        };
      }),
    );
  }

  if (options) {
    logger.debug('replace localized content for filter options', content);
    await Promise.all(
      options.map(async ({ content: optionContent, value: optionValue }) => {
        if (optionContent) {
          await modules.filters.texts.updateTexts(
            { filterId: _id, filterOptionValue: optionValue },
            Object.entries(optionContent).map(([locale, localizedData]: [string, any]) => {
              return {
                locale,
                ...localizedData,
              };
            }),
          );
        }
      }),
    );
  }

  return {
    entity: 'FILTER',
    operation: 'update',
    _id,
    success: true,
  };
}
