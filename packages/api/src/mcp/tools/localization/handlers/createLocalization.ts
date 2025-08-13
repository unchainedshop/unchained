import { Context } from '../../../../context.js';
import sanitizeEntityData from '../../../utils/sanitizeLocalizationEntityData.js';
import validateIsoCode from '../../../utils/validateIsoCode.js';
import { getLocalizationsConfig } from '../getLocalizationsConfig.js';

import { Params } from '../schemas.js';

export default async function createLocalization(context: Context, params: Params<'CREATE'>) {
  const { localizationType, entity } = params;
  const config = getLocalizationsConfig(context, localizationType);

  const sanitizedEntity = sanitizeEntityData(localizationType, entity);
  if (sanitizedEntity.isoCode) {
    sanitizedEntity.isoCode = validateIsoCode(localizationType, sanitizedEntity.isoCode);
  }

  const entityId = await config.module.create(sanitizedEntity as any);
  const newEntity = await config.findMethod({ [config.idField]: entityId });

  return { [config.entityName]: newEntity };
}
