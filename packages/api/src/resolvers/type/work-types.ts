import { WorkerDirector } from '@unchainedshop/core';
import type { Context } from '../../context.ts';
import type { Work as WorkType } from '@unchainedshop/core-worker';
import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';

type HelperType<P, T> = (work: WorkType, params: P, context: Context) => T;

export interface WorkHelperTypes {
  status: HelperType<never, string>;
  type: HelperType<never, string>;
  result: HelperType<never, any>;
  input: HelperType<never, any>;
  error: HelperType<never, any>;
  original: HelperType<never, Promise<WorkType | null>>;
}

export const Work: WorkHelperTypes = {
  status: (obj, _, { modules }) => {
    return modules.worker.status(obj);
  },

  type: (obj) => {
    if (WorkerDirector.getActivePluginTypes().includes(obj.type)) {
      return obj.type;
    }
    return 'UNKNOWN';
  },

  original: async (obj, _, { modules }) => {
    if (!obj.originalWorkId) return null;
    return modules.worker.findWork({ workId: obj.originalWorkId });
  },

  input: (obj, _, { options }: Context) => {
    return buildObfuscatedFieldsFilter(options.worker?.blacklistedVariables)(obj.input);
  },

  result: (obj, _, { options }: Context) => {
    return buildObfuscatedFieldsFilter(options.worker?.blacklistedVariables)(obj.result);
  },

  error: (obj, _, { options }: Context) => {
    return buildObfuscatedFieldsFilter(options.worker?.blacklistedVariables)(obj.error);
  },
};
