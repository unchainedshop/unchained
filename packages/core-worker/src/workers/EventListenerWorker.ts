import { IWorker } from '@unchainedshop/types/worker';
import { WorkerEventTypes } from "../director/WorkerEventTypes.js";
import { WorkerDirector } from "../director/WorkerDirector.js";
import { BaseWorker } from "./BaseWorker.js";

export const EventListenerWorker: IWorker<{ workerId: string }> = {
  ...BaseWorker,

  key: 'shop.unchained.worker.event-listener',
  label: 'Allocates work on events. This worker does not make sense on multiple containers.',
  version: '1.0.0',
  type: 'EVENT_LISTENER',

  actions: ({ workerId }, unchainedAPI) => {
    let onAdded: () => Promise<void>;
    let onFinished: () => Promise<void>;

    const baseWorkerActions = BaseWorker.actions(
      { workerId, worker: EventListenerWorker },
      unchainedAPI,
    );
    return {
      ...baseWorkerActions,

      start() {
        onAdded = async () => {
          await baseWorkerActions.process({
            maxWorkItemCount: 0,
            referenceDate: EventListenerWorker.getFloorDate(),
          });
        };
        onFinished = async () => {
          await baseWorkerActions.process({
            maxWorkItemCount: 0,
            referenceDate: EventListenerWorker.getFloorDate(),
          });
        };

        WorkerDirector.events.on(WorkerEventTypes.ADDED, onAdded);
        WorkerDirector.events.on(WorkerEventTypes.FINISHED, onFinished);

        setTimeout(async () => {
          await baseWorkerActions.autorescheduleTypes({
            referenceDate: EventListenerWorker.getFloorDate(),
          });
        }, 300);
      },

      stop() {
        WorkerDirector.events.off(WorkerEventTypes.ADDED, onAdded);
        WorkerDirector.events.off(WorkerEventTypes.FINISHED, onFinished);
      },
    };
  },
};
