import { Modules } from '@unchainedshop/types/modules';
import { Work } from '@unchainedshop/types/worker';
import { log } from 'meteor/unchained:logger';
import { dbIdToString } from 'meteor/unchained:utils';
import { WorkerDirector } from '../director/WorkerDirector';
import { WorkerEventTypes } from '../director/WorkerEventTypes';

export class FailedRescheduler {
  static key = 'shop.unchained.scheduler.failed';

  static label = 'Reschedule failed works';

  static version = '1.0';

  private modules: Modules;
  
  constructor({ modules }) {
    this.modules = modules;
  }

  handleFinishedWork({ work, userId }: { work: Work; userId: string }) {
    if (!work.success && work.retries > 0) {
      const now = new Date();
      const workDelayMs = work.scheduled.getTime() - work.created.getTime();

      // In short: Double the delay of the old work or delay for 5 seconds
      const scheduled =
        workDelayMs > 1000
          ? new Date(now.getTime() + workDelayMs * 2)
          : new Date(now.setSeconds(now.getSeconds() + 5));

      log(
        /* @ts-ignore */
        `${this.constructor.key} -> Reschedule failed work ${work._id} ${
          work.type
        } for ${scheduled} (in ${Math.round(
          workDelayMs / 1000
        )}). Remaining retries: ${work.retries}`
      );

      this.modules.worker.addWork(
        {
          type: work.type,
          input: work.input,
          priority: work.priority,
          originalWorkId: work.originalWorkId || dbIdToString(work._id),
          retries: work.retries - 1,
          scheduled,
        },
        userId
      );
    }
  }

  start() {
    WorkerDirector.onEmit(
      WorkerEventTypes.FINISHED,
      this.handleFinishedWork.bind(this)
    );
  }

  stop() {
    WorkerDirector.offEmit(
      WorkerEventTypes.FINISHED,
      this.handleFinishedWork.bind(this)
    );
  }
}
