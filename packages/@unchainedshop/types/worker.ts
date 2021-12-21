import { Context } from './api';
import { TimestampFields, _ID } from './common';

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

export interface WorkerPlugin<Args, Result> {
  key: string;
  label: string;
  version: string;
  type: string;
  doWork(args: Args): Promise<WorkResult<Result>>;
}

export interface WorkerDirector {
  getActivePluginTypes: () => Array<string>;
  getPlugin: (type: string) => WorkerPlugin;
  registerPlugin: (plugin: WorkerPlugin) => void;

  configureAutoscheduling: (plugin: WorkerPlugin, work: Work) => void;
  getAutoSchedules: () => Array<Array<string, Work>>;

  emit: (eventName: string, payload: any) => void;
  onEmit: (eventName: string, payload: any) => void;
  offEmit: (eventName: string, payload: any) => void;

  doWork: (work: Work) => Promise<WorkResult<any>>;
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
    types: Array<Worker>;
    worker: string;
  }) => Promise<Work>;

  doWork: (work: Work) => Promise<WorkResult<any>>;

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

type HelperType<P, T> = (provider: Work, params: P, context: Context) => T;

export interface WorkHelperTypes {
  status: HelperType<never, WorkStatus>;
  original: HelperType<never, Promise<Work>>;
}
