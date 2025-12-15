// Database class and functions
export {
  Database,
  // Types
  type SelectOptions,
  type FindOptions,
  type InitDbOptions,
  type SqlJsDatabase,
  // Utilities
  generateId,
  toSnakeCase,
  toSqliteDate,
  fromSqliteDate,
  toSelectOptions,
} from './db.ts';

// Additional utilities
export { toCamelCase, toJson, fromJson } from './helpers.ts';

// Re-export common types for compatibility with mongodb package
export interface TimestampFields {
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export interface LogFields {
  log: {
    date: Date;
    status?: string | null;
    info?: string;
  }[];
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
  id: number;
  name: string;
  up: (params: { logger: any | Console; unchainedAPI: Context }) => Promise<void>;
}

export interface MigrationRepository<Context = unknown> {
  migrations: Map<number, Migration<Context>>;
  register: (migration: Migration<Context>) => void;
  allMigrations: () => Migration<Context>[];
}

import type { Database as DatabaseType } from './db.ts';

export interface ModuleInput<Options = unknown> {
  db?: DatabaseType;
  options?: Options;
  migrationRepository?: MigrationRepository<any>;
}
