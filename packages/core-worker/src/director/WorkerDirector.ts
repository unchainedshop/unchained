import {
  WorkerDirector as IWorkerDirector,
  WorkerPlugin, WorkQueue
} from '@unchainedshop/types/worker';
import { EventEmitter } from 'events';
import { log, LogLevel } from 'meteor/unchained:logger';
import { WorkerEventTypes } from './WorkerEventTypes';

export const DIRECTOR_MARKED_FAILED_ERROR = 'DIRECTOR_MARKED_FAILED';

const Plugins = new Map<string, WorkerPlugin>();
const AutoSchedule = new Map<string, WorkQueue>();
const Events = new EventEmitter();

const WorkerDirector: IWorkerDirector = {

  getActivePluginTypes: () => {
    return Array.from(Plugins.keys());
  },

  getPlugin: (type: string) => {
    return Plugins.get(type)
  },

  registerPlugin: (plugin: WorkerPlugin)  => {
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
    AutoSchedule.set(plugin.type, workQueue);
    log(
      `WorkderDirector -> Configured ${plugin.type} ${plugin.key}@${plugin.version} (${plugin.label}) for Autorun at ${scheduled}`
    );
  },

  emit: Events.emit,
  onEmit: Events.on,
  offEmit: Events.off,

  doWork: async ({ type, input }) => {
    const plugin = Plugins.get(type);

    if (!plugin) log(`WorkderDirector: No registered plugin for type: ${type}`);

    try {
      const output = await plugin.doWork(input);

      Events.emit(WorkerEventTypes.DONE, { output });

      return output;
    } catch (error) {
      // DO not use this as flow control. The plugin should catch expected errors and return status: FAILED
      log('DO not use this as flow control.', { level: LogLevel.Verbose });

      log(`WorkderDirector -> Error doing work ${type}: ${error.message}`);

      const output = { error, success: false };

      Events.emit(WorkerEventTypes.DONE, { output });

      return output;
    }
  },  
}


// eslint-disable-next-line import/prefer-default-export
export { WorkerDirector, WorkerEventTypes, WorkerPlugin };
