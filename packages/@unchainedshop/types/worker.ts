import { EventEmitter } from 'stream';
import { Context } from './api';
import { IBaseAdapter, IBaseDirector, TimestampFields, _ID } from './common';

export enum WorkStatus {
  NEW = 'NEW',
  ALLOCATED = 'ALLOCATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
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
  success?: Boolean;
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
}

interface WorkResult<Result> {
  success: boolean;
  result?: Result;
  error?: any;
}

export type WorkerModule = {
  activeWorkTypes: () => Promise<Array<string>>;
  findWork: (query: {
    workId?: string;
    originalWorkId?: string;
  }) => Promise<Work>;
  findWorkQueue: (
    query: {
      created: { end?: Date; start?: Date };
      selectTypes: Array<string>;
      status: Array<WorkStatus>;
    } & {
      limit?: number;
      skip?: number;
    }
  ) => Promise<Array<Work>>;
  workExists: (query: {
    workId?: string;
    originalWorkId?: string;
  }) => Promise<boolean>;

  // Transformations
  status: (work: Work) => WorkStatus;

  // Mutations
  addWork: (data: WorkData, userId: string) => Promise<Work>;

  allocateWork: (doc: {
    types: Array<string>;
    worker: string;
  }) => Promise<Work>;

  doWork: (work: Work, requestContext: Context) => Promise<WorkResult<any>>;

  ensureOneWork: (work: Work) => Promise<Work>;

  finishWork: (
    _id: string,
    data: WorkResult<any> & {
      finished?: Date;
      started?: Date;
      worker: string;
    },
    userId: string
  ) => Promise<Work | null>;

  deleteWork: (_id: string, userId: string) => Promise<Work | null>;

  markOldWorkAsFailed: (
    params: {
      types: Array<string>;
      worker: string;
      referenceDate: Date;
    },
    userId?: string
  ) => Promise<Array<Work>>;
};

/*
 * Director
 */

export interface WorkerSchedule {
  schedules: Array<Record<string, any>>;
  exceptions: Array<Record<string, any>>;
}

export type WorkScheduleConfigureation = Omit<Work, 'input'> & {
  input: () => any;
  schedule: WorkerSchedule;
};
export type IWorkerAdapter<Args, Result> = IBaseAdapter & {
  type: string;

  doWork: (args: Args, requestContext: Context) => Promise<WorkResult<Result>>;
};

export type IWorkerDirector = IBaseDirector<IWorkerAdapter<any, any>> & {
  getActivePluginTypes: () => Array<string>;

  configureAutoscheduling: (
    adapter: IWorkerAdapter<any, any>,
    workScheduleConfiguration: WorkScheduleConfigureation
  ) => void;
  getAutoSchedules: () => Array<[string, WorkScheduleConfigureation]>;

  events: EventEmitter
  // emit: (eventName: string, payload: any) => void;
  // onEmit: (eventName: string, payload: any) => void;
  // offEmit: (eventName: string, payload: any) => void;

  doWork: (work: Work, requestContext: Context) => Promise<WorkResult<any>>;
};

/*
 * Worker
 */

export type IWorker<P extends { workerId: string }> = {
  key: string;
  label: string;
  version: string;
  type: string;

  getFloorDate: (date?: Date) => Date;
  getInternalTypes: () => Array<string>;

  actions: (
    params: P,
    requestContext: Context
  ) => {
    autorescheduleTypes: (params: {
      referenceDate: Date;
    }) => Promise<Array<Work>>;
    process: (params: {
      maxWorkItemCount?: number;
      referenceDate?: Date;
    }) => Promise<void>;
    reset: () => Promise<void>;
    start: () => void;
    stop: () => void;
  };
};

export type IScheduler = {
  key: string;
  label: string;
  version: string;

  actions: (
    requestContext: Context
  ) => {
    start: () => void;
    stop: () => void;
  };
};
