import { log } from 'meteor/unchained:core-logger';

import { WorkerEventTypes } from '../director';

class FailedRescheduler {
  static key = 'shop.unchained.scheduler.failed';

  static label = 'Reschedule failed works';

  static version = '1.0';

  constructor({ WorkerDirector }) {
    this.WorkerDirector = WorkerDirector;
  }

  handleFinishedWork({ work }) {
    if (!work.success && work.retries > 0) {
      const now = new Date();
      const workDelayMs = work.scheduled - work.created;

      // In short: Double the delay of the old work or delay for 5 seconds
      const scheduled =
        workDelayMs > 1000
          ? new Date(now.getTime() + workDelayMs * 2)
          : new Date(now.setSeconds(now.getSeconds() + 5));

      log(
        `${this.name} -> Reschedule failed work ${work._id} ${
          work.type
        } for ${scheduled} (in ${Math.round(
          workDelayMs / 1000
        )}). Remaining retries: ${work.retries}`
      );

      this.WorkerDirector.addWork({
        type: work.type,
        input: work.input,
        priority: work.priority,
        original: work.original || work._id,
        retries: work.retries - 1,
        scheduled,
      });
    }
  }

  start() {
    this.WorkerDirector.events.on(
      WorkerEventTypes.finished,
      this.handleFinishedWork.bind(this)
    );
  }

  stop() {
    this.WorkerDirector.events.off(
      WorkerEventTypes.finished,
      this.handleFinishedWork.bind(this)
    );
  }
}

export default FailedRescheduler;
