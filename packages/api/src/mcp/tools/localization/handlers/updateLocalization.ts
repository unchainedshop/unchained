import { Context } from '../../../../context.js';
import sanitizeEntityData from '../../../utils/sanitizeLocalizationEntityData.js';
import { getLocalizationsConfig } from '../getLocalizationsConfig.js';

import { Params } from '../schemas.js';

export default async function updateLocalization(context: Context, params: Params<'UPDATE'>) {
  const { localizationType, entityId, entity } = params;
  const config = getLocalizationsConfig(context, localizationType);
  const existsParam = { [config.idField]: entityId };

  if (!(await config.existsMethod(existsParam))) {
    throw new config.NotFoundError(existsParam);
  }

  const updateData = sanitizeEntityData(localizationType, entity);
  await config.module.update(entityId, updateData);
  const updatedEntity = await config.findMethod(existsParam);

  return { [config.entityName]: updatedEntity };
}
