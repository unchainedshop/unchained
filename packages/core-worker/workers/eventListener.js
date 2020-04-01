import { WorkerEventTypes } from '../director';
import BaseWorker from './base';

class EventListenerWorker extends BaseWorker {
  static key = 'shop.unchained.worker.event-listener';

  static label =
    'Allocates work on events. This worker does not make sense on multiple containers.';

  static version = '1.0';

  static type = 'EVENT_LISTENER';

  async handleAllocateWorkFinish() {
    const work = await this.WorkerDirector.allocateWork({
      types: this.getInternalTypes(),
      worker: this.worker,
    });

    if (work) {
      const output = await this.WorkerDirector.doWork(work);

      await this.WorkerDirector.finishWork({
        workId: work._id,
        ...output,
        worker: this.worker,
      });
    }
  }

  start() {
    this.WorkerDirector.events.on(WorkerEventTypes.added, () =>
      this.handleAllocateWorkFinish()
    );
    this.WorkerDirector.events.on(WorkerEventTypes.finished, () =>
      this.handleAllocateWorkFinish()
    );
  }

  stop() {
    this.WorkerDirector.events.off(WorkerEventTypes.added, () =>
      this.handleAllocateWorkFinish()
    );
    this.WorkerDirector.events.off(WorkerEventTypes.finished, () =>
      this.handleAllocateWorkFinish()
    );
  }
}

export default EventListenerWorker;
