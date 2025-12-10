import type { Context } from '../../../../context.ts';
import sanitizeEntityData from '../../../utils/sanitizeLocalizationEntityData.ts';
import validateIsoCode from '../../../utils/validateIsoCode.ts';
import { getLocalizationsConfig } from '../getLocalizationsConfig.ts';

import type { Params } from '../schemas.ts';

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
