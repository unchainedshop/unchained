import { BulkOperationBase } from 'mongodb';
import { UnchainedAPI, UnchainedCoreOptions } from './api';
import { WorkerSchedule } from './worker';

export type BulkImportOperation = (
  payload: any,
  options: {
    bulk: (collection: string) => BulkOperationBase;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<void>;

export type BulkImportHandler = {
  [x: string]: BulkImportOperation;
};

export interface SetupCartsOptions {
  invalidateProviders?: boolean;
  providerInvalidationMaxAgeDays?: number;
  assignCartForUsers?: boolean;
}

export interface SetupWorkqueueOptions {
  batchCount?: number;
  disableWorker?: boolean;
  schedule?: WorkerSchedule;
  workerId?: string;
}

export enum MessageTypes {
  ACCOUNT_ACTION = 'ACCOUNT_ACTION',
  DELIVERY = 'DELIVERY',
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ORDER_REJECTION = 'ORDER_REJECTION',
  QUOTATION_STATUS = 'QUOTATION_STATUS',
  ENROLLMENT_STATUS = 'ENROLLMENT_STATUS',
}

export type PlatformOptions = {
  typeDefs?: Array<string>;
  resolvers?: any;
  schema?: any;
  plugins?: any[];
  cache?: any;
  bulkImporter?: {
    handlers?: Record<string, BulkImportHandler>;
  };
  context?: any;
  modules?: UnchainedCoreOptions['modules'];
  services?: UnchainedCoreOptions['modules'];
  options?: UnchainedCoreOptions['options'];
  rolesOptions?: any;
  workQueueOptions?: SetupWorkqueueOptions & SetupCartsOptions;
  disableEmailInterception?: any;
  introspection?: boolean;
  playground?: boolean;
  tracing?: boolean;
  cacheControl?: any;
  corsOrigins?: any;
};
