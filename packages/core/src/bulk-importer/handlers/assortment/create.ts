import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import upsertAssortmentChildren from './upsertAssortmentChildren.js';
import upsertAssortmentFilters from './upsertAssortmentFilters.js';
import upsertAssortmentProducts from './upsertAssortmentProducts.js';
import upsertMedia from './upsertMedia.js';
import { Modules } from '../../../modules.js';
import { Services } from '../../../services/index.js';

export default async function createAssortment(
  payload: any,
  { logger, createShouldUpsertIfIDExists },
  unchainedAPI: { modules: Modules; services: Services },
) {
  const { modules } = unchainedAPI;
  const { media, specification, products, children, filters, _id } = payload;
  if (!specification) throw new Error(`Specification is required when creating new assortment ${_id}`);

  if (!specification.content)
    throw new Error(`Assortment content is required when creating new assortment${_id}`);

  specification.tags = convertTagsToLowerCase(specification?.tags);

  logger.debug('create assortment object', specification);
  try {
    await modules.assortments.create({ ...specification, _id });
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;
    logger.debug('entity already exists, falling back to update', specification);
    await modules.assortments.update(_id, {
      ...specification,
    });
  }

  if (!(await modules.assortments.assortmentExists({ assortmentId: _id }))) {
    throw new Error(`Can't create assortment ${_id}, fields missing?`);
  }

  if (specification.content) {
    logger.debug('create localized content for assortment', specification.content);
    await modules.assortments.texts.updateTexts(
      _id,
      Object.entries(specification.content).map(([locale, localizedData]: [string, any]) => {
        return {
          locale,
          ...localizedData,
        };
      }),
    );
  }

  logger.debug('create assortment products', products);
  await upsertAssortmentProducts(
    {
      products: products || [],
      assortmentId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create assortment children', children);
  await upsertAssortmentChildren(
    {
      children: children || [],
      assortmentId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create assortment filters', filters);
  await upsertAssortmentFilters(
    {
      filters: filters || [],
      assortmentId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create assortment media', media);
  await upsertMedia({ media: media || [], assortmentId: _id }, unchainedAPI);

  return {
    entity: 'ASSORTMENT',
    operation: 'create',
    _id,
    success: true,
  };
}
