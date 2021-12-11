import { WorkerEventTypes } from '../director/WorkerEventTypes';
import { WorkerDirector } from '../director/WorkerDirector';
import BaseWorker from './BaseWorker';

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

    WorkerDirector.onEmit(WorkerEventTypes.ADDED, this.onAdded);
    WorkerDirector.onEmit(WorkerEventTypes.FINISHED, this.onFinished);

    setTimeout(() => {
      /* @ts-ignore */
      this.autorescheduleTypes(this.constructor.floorDate());
    }, 300);
  }

  stop() {
    WorkerDirector.offEmit(WorkerEventTypes.ADDED, this.onAdded);
    WorkerDirector.offEmit(WorkerEventTypes.FINISHED, this.onFinished);
  }
}

export default EventListenerWorker;
