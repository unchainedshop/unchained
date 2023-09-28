import { EventEmitter } from 'stream';
import { SortOption } from './api.js';
import { IBaseAdapter, IBaseDirector, TimestampFields, _ID } from './common.js';
import { UnchainedCore } from './core.js';

export enum WorkStatus {
  NEW = 'NEW',
  ALLOCATED = 'ALLOCATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export enum WorkerEventTypes {
  ADDED = 'added',
  ALLOCATED = 'allocated',
  DONE = 'done',
  FINISHED = 'finished',
  DELETED = 'deleted',
  RESCHEDULED = 'rescheduled',
}

export type Work = {
  _id?: _ID;
  priority: number;
  retries: number;
  scheduled: Date;
  type: string;
  input: Record<string, any>;
  error?: any;
  finished?: Date;
  originalWorkId?: string;
  result?: any;
  started?: Date;
  success?: boolean;
  timeout?: number;
  worker?: string;
} & TimestampFields;

/*
 * Module
 */

export type WorkData = Pick<
  Partial<Work>,
  'input' | 'originalWorkId' | 'priority' | 'retries' | 'timeout' | 'scheduled' | 'worker'
> & { type: string };

export interface WorkResult<Result> {
  success: boolean;
  result?: Result;
  error?: any;
}

export type WorkQueueQuery = {
  created?: { end?: Date; start?: Date };
  types?: Array<string>;
  status: Array<WorkStatus>;
  queryString?: string;
  scheduled?: { end?: Date; start?: Date };
};

export type WorkerModule = {
  activeWorkTypes: () => Promise<Array<string>>;
  findWork: (query: { workId?: string; originalWorkId?: string }) => Promise<Work>;
  findWorkQueue: (
    query: WorkQueueQuery & {
      sort?: Array<SortOption>;
      limit?: number;
      skip?: number;
    },
  ) => Promise<Array<Work>>;
  count: (query: WorkQueueQuery) => Promise<number>;
  workExists: (query: { workId?: string; originalWorkId?: string }) => Promise<boolean>;

  // Transformations
  status: (work: Work) => WorkStatus;

  type: (work: Work) => string;

  // Mutations
  addWork: (data: WorkData) => Promise<Work>;

  allocateWork: (doc: { types: Array<string>; worker: string }) => Promise<Work>;

  processNextWork: (unchainedAPI: UnchainedCore, workerId?: string) => Promise<Work>;

  rescheduleWork: (work: Work, scheduled: Date, unchainedAPI: UnchainedCore) => Promise<Work>;

  ensureOneWork: (work: WorkData) => Promise<Work>;

  finishWork: (
    _id: string,
    data: WorkResult<any> & {
      finished?: Date;
      started?: Date;
      worker?: string;
    },
  ) => Promise<Work | null>;

  deleteWork: (_id: string) => Promise<Work | null>;

  markOldWorkAsFailed: (params: {
    types: Array<string>;
    worker: string;
    referenceDate: Date;
  }) => Promise<Array<Work>>;
};

/*
 * Director
 */

export interface WorkerSchedule {
  schedules: Array<Record<string, any>>;
  exceptions: Array<Record<string, any>>;
}

export type WorkScheduleConfiguration = Pick<WorkData, 'timeout' | 'retries' | 'priority' | 'worker'> & {
  input?: (workData: Omit<WorkData, 'input'>) => Promise<Record<string, any> | null>;
  schedule: WorkerSchedule;
};
export type IWorkerAdapter<Input, Output> = IBaseAdapter & {
  type: string;
  external: boolean;
  maxParallelAllocations?: number;

  doWork: (input: Input, unchainedAPI: UnchainedCore, workId: string) => Promise<WorkResult<Output>>;
};

export type IWorkerDirector = IBaseDirector<IWorkerAdapter<any, any>> & {
  getActivePluginTypes: (options?: { external?: boolean }) => Array<string>;
  getAdapterByType: (type: string) => IWorkerAdapter<any, any>;
  disableAutoscheduling: (type: string) => void;
  configureAutoscheduling: (
    adapter: IWorkerAdapter<any, any>,
    workScheduleConfiguration: WorkScheduleConfiguration,
  ) => void;
  getAutoSchedules: () => Array<[string, WorkScheduleConfiguration]>;

  events: EventEmitter;
  // emit: (eventName: string, payload: any) => void;
  // onEmit: (eventName: string, payload: any) => void;
  // offEmit: (eventName: string, payload: any) => void;

  doWork: (work: Work, unchainedAPI: UnchainedCore) => Promise<WorkResult<any>>;
};

/*
 * Worker
 */

export type IWorker<P extends { workerId?: string }> = {
  key: string;
  label: string;
  version: string;
  type: string;
  external: boolean;

  getFloorDate: (date?: Date) => Date;

  actions: (
    params: P,
    unchainedAPI: UnchainedCore,
  ) => {
    autorescheduleTypes: (options: { referenceDate: Date }) => Promise<Array<Work | null>>;
    process: (options: { maxWorkItemCount?: number; referenceDate?: Date }) => Promise<void>;
    reset: () => Promise<void>;
    start: () => void;
    stop: () => void;
  };
};

export type IScheduler<P> = {
  key: string;
  label: string;
  version: string;

  actions: (
    params: P,
    unchainedAPI: UnchainedCore,
  ) => {
    start: () => void;
    stop: () => void;
  };
};
