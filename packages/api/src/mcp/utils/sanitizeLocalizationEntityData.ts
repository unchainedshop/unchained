import type {
  LocalizationType,
  LocalizationEntity,
  LocalizationUpdateEntity,
} from '../tools/localization/types.ts';
import validateIsoCode from './validateIsoCode.ts';

const sanitizeEntityData = (
  localizationType: LocalizationType,
  entity: LocalizationEntity | LocalizationUpdateEntity,
) => {
  const entityData = { ...entity };

  if (localizationType !== 'CURRENCY') {
    delete entityData.contractAddress;
    delete entityData.decimals;
  }

  if (entityData.isoCode) {
    entityData.isoCode = validateIsoCode(localizationType, entityData.isoCode);
  }

  return entityData;
};

export default sanitizeEntityData;
