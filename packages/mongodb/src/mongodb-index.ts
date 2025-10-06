import * as mongodb from 'mongodb';

export { initDb, startDb, stopDb } from './initDb.js';

/*
 * Db utils
 */

export { generateDbObjectId } from './generate-db-object-id.js';
export { generateDbFilterById } from './generate-db-filter-by-id.js';
export { buildDbIndexes } from './build-db-indexes.js';
export { findPreservingIds } from './find-preserving-ids.js';
export { buildSortOptions } from './build-sort-option.js';
export { findLocalizedText } from './find-localized-text.js';
export { insensitiveTrimmedRegexOperator } from './insensitive-trimmed-regex-operator.js';
export * from './documentdb-compat-mode.js';

export { mongodb };

export interface LogFields {
  log: (
    | {
        date: Date;
        status: string | null;
        info?: string;
      }
    | {
        date: Date;
        status?: string;
        info: string;
      }
  )[];
}

export interface TimestampFields {
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

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

export interface Migration<Context = unknown> {
  /**
   * Migration ID must be between 19700000000000 and 99999999999999
   * YYYYMMDDHHMMSS format is recommended.
   * @minimum 19700000000000
   * @maximum 99999999999999
   */
  id: number;
  name: string;
  up: (params: { logger: any | Console; unchainedAPI: Context }) => Promise<void>;
}

export interface MigrationRepository<Context = unknown> {
  db: mongodb.Db;
  migrations: Map<number, Migration<Context>>;
  register: (migration: Migration<Context>) => void;
  allMigrations: () => Migration<Context>[];
}

export interface ModuleInput<Options extends Record<string, any>> {
  db: mongodb.Db;
  migrationRepository: MigrationRepository;
  options?: Options;
}
