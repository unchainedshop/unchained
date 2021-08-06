import { WorkerEventTypes } from '../director';
import BaseWorker from './base';

class EventListenerWorker extends BaseWorker {
  static key = 'shop.unchained.worker.event-listener';

  static label =
    'Allocates work on events. This worker does not make sense on multiple containers.';

  static version = '1.0';

  static type = 'EVENT_LISTENER';

  start() {
    this.onAdded = ({ work }) => {
      this.process({
        maxWorkItemCount: 0,
        referenceDate: this.constructor.floorDate(new Date(work.scheduled)),
      });
    };
    this.onFinished = ({ work }) => {
      this.process({
        maxWorkItemCount: 0,
        referenceDate: this.constructor.floorDate(new Date(work.scheduled)),
      });
    };
    this.WorkerDirector.events.on(WorkerEventTypes.added, this.onAdded);
    this.WorkerDirector.events.on(WorkerEventTypes.finished, this.onFinished);
    setTimeout(() => {
      this.autorescheduleTypes(this.constructor.floorDate());
    }, 300);
  }

  stop() {
    this.WorkerDirector.events.off(WorkerEventTypes.added, this.onAdded);
    this.WorkerDirector.events.off(WorkerEventTypes.finished, this.onFinished);
  }
}

export default EventListenerWorker;
