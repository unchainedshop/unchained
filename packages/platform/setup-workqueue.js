import { WorkerDirector } from 'meteor/unchained:core-worker';
import EventListenerWorker from 'meteor/unchained:core-worker/workers/eventListener';
import CronWorker from 'meteor/unchained:core-worker/workers/cron';
// import IntervalWorker from 'meteor/unchained:core-worker/workers/interval';
import FailedRescheduler from 'meteor/unchained:core-worker/schedulers/failedRescheduler';

export const workerTypeDefs = () => [
  /* GraphQL */ `
    extend enum WorkType {
      ${WorkerDirector.getActivePluginTypes().join(',')}
    }
  `,
];

export default ({ cronText }) => {
  const handlers = [];
  handlers.push(new FailedRescheduler({ WorkerDirector }));
  handlers.push(
    new EventListenerWorker({
      WorkerDirector,
      workerId: 'EventWorker',
    })
  );
  // handlers.push(
  //   new IntervalWorker({
  //     WorkerDirector,
  //     workerId: 'IntervalWorker',
  //   })
  // );
  if (cronText) {
    handlers.push(
      new CronWorker({
        WorkerDirector,
        workerId: 'CronWorker',
        cronText,
      })
    );
  }

  handlers.forEach((handler) => handler.start());
  return () => {
    handlers.forEach((handler) => handler.stop());
  };
};
