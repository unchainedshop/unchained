import { WorkerEventTypes } from '../../../director';
import { WorkerDirector } from '../WorkerDirector';
import BaseWorker from './base';

class EventListenerWorker extends BaseWorker {
  static key = 'shop.unchained.worker.event-listener';

  static label =
    'Allocates work on events. This worker does not make sense on multiple containers.';

  static version = '1.0';

  static type = 'EVENT_LISTENER';

  private onAdded: () => void;
  private onFinished: () => void;

  start() {
    this.onAdded = () => {
      this.process({
        maxWorkItemCount: 0,
        /* @ts-ignore */
        referenceDate: this.constructor.floorDate(),
      });
    };
    this.onFinished = () => {
      this.process({
        maxWorkItemCount: 0,
        /* @ts-ignore */
        referenceDate: this.constructor.floorDate(),
      });
    };
    WorkerDirector.onEmit(WorkerEventTypes.added, this.onAdded);
    WorkerDirector.onEmit(WorkerEventTypes.finished, this.onFinished);
    setTimeout(() => {
      /* @ts-ignore */
      this.autorescheduleTypes(this.constructor.floorDate());
    }, 300);
  }

  stop() {
    WorkerDirector.offEmit(WorkerEventTypes.added, this.onAdded);
    WorkerDirector.offEmit(WorkerEventTypes.finished, this.onFinished);
  }
}

export default EventListenerWorker;
