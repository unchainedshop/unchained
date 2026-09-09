import { subscribe } from '@unchainedshop/events';
import { BaseWorker, type IWorker } from './BaseWorker.ts';
import { WorkerEventTypes } from '@unchainedshop/core-worker';
import { setTimeout } from 'node:timers/promises';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:worker:event-listener');

export function debounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => Promise<void>) & { cancel: () => void } {
  let abortController: AbortController | null = null;
  let running: Promise<void> | null = null;
  let runAgain = false;

  // Never run `func` concurrently with itself. The work queue processes one item
  // per pass and relies on `maxParallelAllocations` being checked against an
  // up-to-date in-flight count; overlapping passes race that check and allocate
  // the same-typed work twice. If a new trigger arrives while a pass is running,
  // remember it and run exactly one more pass afterwards so no work is missed.
  const runExclusively = async (...args: Parameters<T>): Promise<void> => {
    if (running) {
      runAgain = true;
      return running;
    }
    running = (async () => {
      try {
        do {
          runAgain = false;
          await func(...args);
        } while (runAgain);
      } finally {
        running = null;
      }
    })();
    return running;
  };

  const debounced = (async (...args: Parameters<T>) => {
    // Coalesce a burst of events into a single trailing pass.
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller for this execution
    abortController = new AbortController();

    try {
      // Wait for the debounce period
      await setTimeout(wait, undefined, { signal: abortController.signal });

      // If we reach here, the timeout completed without being aborted
      abortController = null;
      await runExclusively(...args);
    } catch (error) {
      // If the operation was aborted, don't execute the function
      if (error.name === 'AbortError') {
        return;
      }
      // Re-throw any other errors
      throw error;
    }
  }) as ((...args: Parameters<T>) => Promise<void>) & { cancel: () => void };

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
