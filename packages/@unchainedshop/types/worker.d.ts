import { Context } from './api';
import {
  ModuleMutations,
  Query,
  TimestampFields,
  _ID,
  FindOptions,
} from './common';

export enum WorkStatus {
  NEW = 'NEW',
  ALLOCATED = 'ALLOCATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export type WorkQueue = {
  _id?: _ID;
  error?: any;
  finished?: Date;
  input?: any;
  originalWorkId?: string;
  priority: Number;
  result?: any;
  retries: number;
  scheduled: Date;
  started?: Date;
  success?: Boolean;
  timeout?: number;
  type: string;
  worker?: string;
} & TimestampFields;

interface WorkQueueData {
  type: string;
  input: any;
  originalWorkId?: string;
  priority?: number;
  retries?: number;
  scheduled?: Date;
}

export interface WorkerPlugin<Args, Result> {
  key: string;
  label: string;
  version: string;
  type: string;
  doWork(args: Args): Promise<{ success: boolean; result?: Result }>;
}

export interface WorkerDirector {
  getActivePluginTypes: () => Array<string>;
  getPlugin: (type: string) => WorkerPlugin;
  registerPlugin: (plugin: WorkerPlugin) => void;
  configureAutoscheduling: (
    plugin: WorkerPlugin,
    workQueue: WorkQueue,
  ) => void;

  emit: (eventName: string, payload: any) => void
  onEmit: (eventName: string, payload: any) => void
  offEmit: (eventName: string, payload: any) => void

  doWork: (workQueue: WorkQueue) => Promise<{ success: boolean, result?: any }>
}

export type WorkerModule = {
  activeWorkTypes: () => Promise<Array<WorkQueue>>;
  findWorkQueue: (
    query: {
      workQueueId?: string;
      originalWorkId?: string;
    },
    options?: FindOptions<WorkQueue>
  ) => Promise<WorkQueue>;
  findWorkQueues: (
    query: {
      created: { end?: Date; start?: Date };
      selectTypes: Array<string>;
      status: Array<WorkStatus>;
    } & {
      limit?: number;
      skip?: number;
    }
  ) => Promise<Array<WorkQueue>>;
  workQueueExists: (query: {
    workQueueId?: string;
    originalWorkId?: string;
  }) => Promise<boolean>;

  // Transformations
  status: (workQueue: WorkQueue) => WorkStatus;

  // Mutations
  addWork: (data: WorkQueueData, userId: string) => Promise<WorkQueue>;

  allocateWork: (doc: {
    types: Array<Worker>;
    worker: string;
  }) => Promise<WorkQueue>;

  ensureOneWork: (data: WorkQueueData, userId) => Promise<WorkQueue>;

  finishWork: (
    _id: string,
    data: {
      error?: any;
      finished: Date;
      result?: any;
      started?: Date;
      success: boolean;
      worker: string;
    },
    userId: string
  ) => Promise<WorkQueue | null>;

  deleteWork: (_id: string, userId: string) => Promise<WorkQueue | null>;

  markOldWorkAsFailed: (
    params: {
      types: Array<string>;
      worker: string;
      referenceDate: Date;
    },
    userId
  ) => Promise<Array<WorkQueue>>;
};

type HelperType<P, T> = (provider: WorkQueue, params: P, context: Context) => T;

export interface WorkQueueHelperTypes {
  status: HelperType<never, WorkStatus>;
  original: HelperType<never, Promise<WorkQueue>>;
}
