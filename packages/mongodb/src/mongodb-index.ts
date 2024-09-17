import * as mongodb from 'mongodb';

export { initDb, startDb, stopDb } from './initDb.js';

/*
 * Db utils
 */

export { generateDbObjectId } from './generate-db-object-id.js';
export { generateDbFilterById } from './generate-db-filter-by-id.js';
export { generateDbMutations } from './generate-db-mutations.js';
export { buildDbIndexes } from './build-db-indexes.js';
export { findPreservingIds } from './find-preserving-ids.js';
export { buildSortOptions } from './build-sort-option.js';
export { findLocalizedText } from './find-localized-text.js';
export { emailRegexOperator } from './email-regex-operator.js';

export { mongodb };

export type LogFields = {
  log: Array<{
    date: Date;
    status?: string;
    info: string;
  }>;
};

export type TimestampFields = {
  created?: Date;
  updated?: Date;
  deleted?: Date;
};

export interface Address {
  addressLine?: string;
  addressLine2?: string;
  city?: string;
  company?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  postalCode?: string;
  regionCode?: string;
}

export interface Contact {
  telNumber?: string;
  emailAddress?: string;
}
