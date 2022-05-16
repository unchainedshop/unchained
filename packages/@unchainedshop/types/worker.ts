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
}

export interface WorkResult<Result> {
  success: boolean;
  result?: Result;
  error?: any;
}

export type WorkerModule = {
  activeWorkTypes: () => Promise<Array<string>>;
  findWork: (query: { workId?: string; originalWorkId?: string }) => Promise<Work>;
  findWorkQueue: (
    query: {
      created?: { end?: Date; start?: Date };
      scheduled?: { end?: Date; start?: Date };
      selectTypes?: Array<string>;
      status?: Array<WorkStatus>;
      queryString?: string;
    } & {
      limit?: number;
      skip?: number;
    },
  ) => Promise<Array<Work>>;
  workExists: (query: { workId?: string; originalWorkId?: string }) => Promise<boolean>;

  // Transformations
  status: (work: Work) => WorkStatus;

  type: (work: Work) => string;

  // Mutations
  addWork: (data: WorkData, userId: string) => Promise<Work>;

  allocateWork: (doc: { types: Array<string>; worker: string }) => Promise<Work>;

  doWork: (work: Work, requestContext: Context) => Promise<WorkResult<any>>;

  rescheduleWork: (work: Work, scheduled: Date, requestContext) => Promise<Work>;

  ensureOneWork: (work: Work) => Promise<Work>;

  finishWork: (
    _id: string,
    data: WorkResult<any> & {
      finished?: Date;
      started?: Date;
      worker: string;
    },
    userId: string,
  ) => Promise<Work | null>;

  deleteWork: (_id: string, userId: string) => Promise<Work | null>;

  markOldWorkAsFailed: (
    params: {
      types: Array<string>;
      worker: string;
      referenceDate: Date;
    },
    userId?: string,
  ) => Promise<Array<Work>>;
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

  doWork: (input: Input, requestContext: Context, workId: string) => Promise<WorkResult<Output>>;
};

export type IWorkerDirector = IBaseDirector<IWorkerAdapter<any, any>> & {
  getActivePluginTypes: () => Array<string>;

  configureAutoscheduling: (
    adapter: IWorkerAdapter<any, any>,
    workScheduleConfiguration: WorkScheduleConfiguration,
  ) => void;
  getAutoSchedules: () => Array<[string, WorkScheduleConfiguration]>;

  events: EventEmitter;
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
    requestContext: Context,
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

  actions: (requestContext: Context) => {
    start: () => void;
    stop: () => void;
  };
};
