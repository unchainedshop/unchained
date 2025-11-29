import { z } from 'zod';
import { Modules } from '../../../modules.js';

export const LocalizedContentSchema = z.record(
  z.string(), // locale
  z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }),
);

export const FilterCreatePayloadSchema = z.object({
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

export default async function createFilter(
  payload: any,
  { logger, createShouldUpsertIfIDExists },
  unchainedAPI: { modules: Modules },
) {
  const { modules } = unchainedAPI;
  const { specification, _id } = payload;

  if (!specification) throw new Error(`Specification is required when creating new filter ${_id}`);

  const { content, options, ...filterData } = specification;

  if (!content) throw new Error(`Localizable content is required when creating new filter${_id}`);

  logger.debug('create filter object', specification);
  try {
    await unchainedAPI.modules.filters.create({
      ...filterData,
      _id,
      options: options?.map((option) => option.value) || [],
    });
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;

    logger.debug('entity already exists, falling back to update', specification);
    await modules.filters.update(_id, {
      ...filterData,
      options: options?.map((option) => option.value) || [],
    });
  }

  if (!(await modules.filters.filterExists({ filterId: _id }))) {
    throw new Error(`Can't upsert filter ${_id}`);
  }

  if (content) {
    logger.debug('create localized content for filter', content);
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
    logger.debug('create localized content for filter options', content);
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
    operation: 'create',
    _id,
    success: true,
  };
}
