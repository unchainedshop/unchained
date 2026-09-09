import { subscribe } from '@unchainedshop/events';
import { BaseWorker, type IWorker } from './BaseWorker.ts';
import { WorkerEventTypes } from '@unchainedshop/core-worker';
import { setTimeout } from 'node:timers/promises';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:worker:event-listener');

function debounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number,
): T & { cancel: () => void } {
  let abortController: AbortController | null = null;

  const debounced = (async (...args: Parameters<T>) => {
    // Cancel any pending execution
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller for this execution
    abortController = new AbortController();

    try {
      // Wait for the debounce period
      await setTimeout(wait, undefined, { signal: abortController.signal });

      // If we reach here, the timeout completed without being aborted
      const result = await func(...args);
      abortController = null;
      return result;
    } catch (error) {
      // If the operation was aborted, don't execute the function
      if (error.name === 'AbortError') {
        return;
      }
      // Re-throw any other errors
      throw error;
    }
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };

  return debounced;
}

export interface EventListenerWorkerParams {
  workerId?: string;
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
      try {
        await baseWorkerActions.process({
          maxWorkItemCount: 1, // only one work item at a time, else we could end up in a loop
          referenceDate: EventListenerWorker.getFloorDate(),
        });
      } catch (error) {
        // Log error but don't crash the worker
        logger.error(error);
      }
    }, 300);

    return {
      ...baseWorkerActions,

      async start() {
        subscribe(WorkerEventTypes.ADDED, processWorkQueue);
        subscribe(WorkerEventTypes.FINISHED, processWorkQueue);

        await setTimeout(300);
        await baseWorkerActions.autorescheduleTypes({
          referenceDate: EventListenerWorker.getFloorDate(),
        });
      },

      stop() {
        processWorkQueue.cancel();
      },
    };
  },
};
