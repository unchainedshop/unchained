import { AddressSchema } from './schemas/AddressSchema';
import { ContactSchema } from './schemas/ContactSchema';
import { timestampFields, contextFields, logFields } from './schemas/commonSchemaFields';
import { UserSchema } from './schemas/UsersSchema';

export { default as findLocalizedText } from './find-localized-text';
export * from './locale-helpers';
export { default as objectInvert } from './object-invert';
export { default as findUnusedSlug } from './find-unused-slug';
export { default as slugify } from './slugify';
export { default as pipePromises } from './pipe-promises';
export { default as generateRandomHash } from './generate-random-hash';
export { default as randomValueHex } from './random-value-hex';
export { default as buildSortOptions } from './db/build-sort-option';

/*
 * Db utils
 */

export { checkId } from './db/check-id';
export { generateDbObjectId } from './db/generate-db-object-id';
export { generateDbFilterById } from './db/generate-db-filter-by-id';
export { generateDbMutations } from './db/generate-db-mutations';
export { buildDbIndexes } from './db/build-db-indexes';
export { findPreservingIds } from './find-preserving-ids';

/*
 * Schemas
 */

const Schemas = {
  timestampFields,
  contextFields,
  logFields,
  Address: AddressSchema,
  Contact: ContactSchema,
  User: UserSchema,
};

export { Schemas };

/*
 * Director
 */

export { BaseAdapter } from './director/BaseAdapter';
export { BaseDirector } from './director/BaseDirector';
export { BasePricingAdapter } from './director/BasePricingAdapter';
export { BasePricingDirector } from './director/BasePricingDirector';
export { BasePricingSheet } from './director/BasePricingSheet';
export { BaseDiscountAdapter } from './director/BaseDiscountAdapter';
export { BaseDiscountDirector } from './director/BaseDiscountDirector';
