import { IWorker } from '@unchainedshop/types/worker.js';
import { WorkerEventTypes } from '../director/WorkerEventTypes.js';
import { WorkerDirector } from '../director/WorkerDirector.js';
import { BaseWorker } from './BaseWorker.js';

function debounce<T extends (...args: any) => any>(func: T, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };
}

export interface EventListenerWorkerParams {
  workerId: string;
}

export const EventListenerWorker: IWorker<EventListenerWorkerParams> = {
  ...BaseWorker,

  key: 'shop.unchained.worker.event-listener',
  label: 'Allocates work on events. This worker does not make sense on multiple containers.',
  version: '1.0.0',
  type: 'EVENT_LISTENER',

  actions: ({ workerId }, unchainedAPI) => {
    const baseWorkerActions = BaseWorker.actions(
      { workerId, worker: EventListenerWorker },
      unchainedAPI,
    );

    // Debounce in the event of many work queue events conflicting with each other
    const processWorkQueue = debounce<() => Promise<void>>(async () => {
      await baseWorkerActions.process({
        maxWorkItemCount: 1, // only one work item at a time, else we could end up in a loop
        referenceDate: EventListenerWorker.getFloorDate(),
      });
    }, 300);

    return {
      ...baseWorkerActions,

      start() {
        WorkerDirector.events.on(WorkerEventTypes.ADDED, processWorkQueue);
        WorkerDirector.events.on(WorkerEventTypes.FINISHED, processWorkQueue);

        setTimeout(async () => {
          await baseWorkerActions.autorescheduleTypes({
            referenceDate: EventListenerWorker.getFloorDate(),
          });
        }, 300);
      },

      stop() {
        WorkerDirector.events.off(WorkerEventTypes.ADDED, processWorkQueue);
        WorkerDirector.events.off(WorkerEventTypes.FINISHED, processWorkQueue);
      },
    };
  },
};
