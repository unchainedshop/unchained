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
  error?: any;
  finished?: Date;
  input?: any;
  originalWorkId?: string;
  priority: number;
  result?: any;
  retries: number;
  scheduled: Date;
  started?: Date;
  success?: boolean;
  timeout?: number;
  type: string;
  worker?: string;
} & TimestampFields;

/*
 * Module
 */

export interface WorkData {
  type: string;
  input: any;
  originalWorkId?: string;
  priority?: number;
  retries?: number;
  scheduled?: Date;
  worker?: string;
}

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

  processNextWork: (worker: string, unchainedAPI: UnchainedCore) => Promise<Work>;

  rescheduleWork: (work: Work, scheduled: Date, unchainedAPI: UnchainedCore) => Promise<Work>;

  ensureOneWork: (work: Work) => Promise<Work>;

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

export type WorkScheduleConfiguration = Omit<Partial<Work>, 'input'> & {
  input: () => any;
  schedule: WorkerSchedule;
};
export type IWorkerAdapter<Input, Output> = IBaseAdapter & {
  type: string;
  external: boolean;

  doWork: (input: Input, unchainedAPI: UnchainedCore, workId: string) => Promise<WorkResult<Output>>;
};

export type IWorkerDirector = IBaseDirector<IWorkerAdapter<any, any>> & {
  getActivePluginTypes: (external?: boolean) => Array<string>;
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

export type IWorker<P extends { workerId: string }> = {
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
    autorescheduleTypes: (options: { referenceDate: Date }) => Promise<Array<Work>>;
    process: (options: { maxWorkItemCount?: number; referenceDate?: Date }) => Promise<void>;
    reset: () => Promise<void>;
    start: () => void;
    stop: () => void;
  };
};

export type IScheduler = {
  key: string;
  label: string;
  version: string;

  actions: (unchainedAPI: UnchainedCore) => {
    start: () => void;
    stop: () => void;
  };
};
