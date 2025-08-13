import { Context } from '../../../../context.js';
import {
  getLocalizationConfig,
  sanitizeEntityData,
  validateIsoCode,
} from '../../../modules/configureLocalizationMcpModule.js';
import { Params } from '../schemas.js';

export default async function createLocalization(context: Context, params: Params<'CREATE'>) {
  const { localizationType, entity } = params;
  const config = getLocalizationConfig(context, localizationType);

  // Sanitize and validate the entity data
  const sanitizedEntity = sanitizeEntityData(localizationType, entity);
  if (sanitizedEntity.isoCode) {
    sanitizedEntity.isoCode = validateIsoCode(localizationType, sanitizedEntity.isoCode);
  }

  const entityId = await config.module.create(sanitizedEntity as any);
  const newEntity = await config.findMethod({ [config.idField]: entityId });

  return { [config.entityName]: newEntity };
}
