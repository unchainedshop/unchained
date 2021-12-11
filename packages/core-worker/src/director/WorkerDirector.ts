import {
  WorkerDirector as IWorkerDirector,
  WorkerPlugin,
  Work,
} from '@unchainedshop/types/worker';
import { EventEmitter } from 'events';
import { log, LogLevel } from 'meteor/unchained:logger';
import { WorkerEventTypes } from './WorkerEventTypes';

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

const Plugins = new Map<string, WorkerPlugin<any, any>>();
const AutoScheduleMap = new Map<string, Work>();
const Events = new EventEmitter();

const WorkerDirector: IWorkerDirector = {
  getActivePluginTypes: () => {
    return Array.from(Plugins.keys());
  },

  getPlugin: (type: string) => {
    return Plugins.get(type);
  },

  registerPlugin: (plugin: WorkerPlugin<any, any>) => {
    if (Plugins.get(plugin.type))
      throw new Error(
        `WorkderDirector: There is already a plugin registered with type: ${plugin.type}`
      );

    Plugins.set(plugin.type, plugin);

    log(
      `WorkderDirector -> Registered ${plugin.type} ${plugin.key}@${plugin.version} (${plugin.label})`
    );
  },

  configureAutoscheduling: (plugin, workQueue) => {
    const { scheduled } = workQueue;
    AutoScheduleMap.set(plugin.type, workQueue);
    log(
      `WorkderDirector -> Configured ${plugin.type} ${plugin.key}@${plugin.version} (${plugin.label}) for Autorun at ${scheduled}`
    );
  },
  getAutoSchedules: () => Array.from(AutoScheduleMap),

  emit: Events.emit,
  onEmit: Events.on,
  offEmit: Events.off,

  doWork: async ({ type, input }) => {
    const plugin = Plugins.get(type);

    if (!plugin) log(`WorkderDirector: No registered plugin for type: ${type}`);

    const output = await plugin.doWork(input).catch((error) => {
      // DO not use this as flow control. The plugin should catch expected errors and return status: FAILED
      log('DO not use this as flow control.', { level: LogLevel.Verbose });

      log(`WorkderDirector -> Error doing work ${type}: ${error.message}`);

      const output = { error, success: false };

      Events.emit(WorkerEventTypes.DONE, { output });

      return output;
    });

    Events.emit(WorkerEventTypes.DONE, { output });

    return output;
  },
};

// eslint-disable-next-line import/prefer-default-export
export { WorkerDirector, WorkerEventTypes, WorkerPlugin };
