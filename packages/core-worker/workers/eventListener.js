import { WorkerEventTypes } from '../director';
import BaseWorker from './base';

class EventListenerWorker extends BaseWorker {
  static key = 'shop.unchained.worker.event-listener';

  static label =
    'Allocates work on events. This worker does not make sense on multiple containers.';

  static version = '1.0';

  static type = 'EVENT_LISTENER';

  start() {
    this.onAdded = () => {
      this.findOneAndProcessWork();
    };
    this.onFinished = () => {
      this.findOneAndProcessWork().then(() => {
        setTimeout(() => {
          this.autorescheduleTypes();
        }, 5000);
      });
    };
    this.autorescheduleTypes().then(() => {
      this.WorkerDirector.events.on(WorkerEventTypes.added, this.onAdded);
      this.WorkerDirector.events.on(WorkerEventTypes.finished, this.onFinished);
    });
  }

  stop() {
    this.WorkerDirector.events.off(WorkerEventTypes.added, this.onAdded);
    this.WorkerDirector.events.off(WorkerEventTypes.finished, this.onFinished);
  }
}

export default EventListenerWorker;
