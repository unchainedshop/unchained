import { WorkerEventTypes } from '../director';
import BaseWorker from './base';

class EventListenerWorker extends BaseWorker {
  static key = 'shop.unchained.worker.event-listener';

  static label =
    'Allocates work on events. This worker does not make sense on multiple containers.';

  static version = '1.0';

  static type = 'EVENT_LISTENER';

  start() {
    this.WorkerDirector.events.on(WorkerEventTypes.added, () =>
      this.findOneAndProcessWork()
    );
    this.WorkerDirector.events.on(WorkerEventTypes.finished, () =>
      this.findOneAndProcessWork()
    );
  }

  stop() {
    this.WorkerDirector.events.off(WorkerEventTypes.added, () =>
      this.findOneAndProcessWork()
    );
    this.WorkerDirector.events.off(WorkerEventTypes.finished, () =>
      this.findOneAndProcessWork()
    );
  }
}

export default EventListenerWorker;
