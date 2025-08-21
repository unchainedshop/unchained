import {
  LocalizationType,
  LocalizationEntity,
  LocalizationUpdateEntity,
} from '../tools/localization/types.js';
import validateIsoCode from './validateIsoCode.js';

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
