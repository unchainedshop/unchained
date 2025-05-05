import { WorkStatus } from '@unchainedshop/core-worker';
import { IWorkerAdapter, WorkerDirector, WorkerAdapter } from '@unchainedshop/core';
import later from '@breejs/later';

interface Arg {
  secondsPassed?: number;
}

interface Result {
  forked?: string;
}

const everyDayAtFourInTheNight = later.parse.cron('0 3 * * *');

export const ErrorNotifications: IWorkerAdapter<Arg, Result> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker.error-notifications',
  label: 'Send a daily report about errors that failed permanently/unrecoverable',
  version: '1.0',

  type: 'ERROR_NOTIFICATIONS',

  doWork: async (args, context, workId) => {
    const work = await context.modules.worker.findWork({ workId });
    const secondsPassed = args?.secondsPassed || 60;
    const to = new Date();
    const from = new Date(new Date(work.scheduled).getTime() - secondsPassed * 1000);

    try {
      const workItems = (
        await context.modules.worker.findWorkQueue({
          scheduled: {
            end: to,
            start: from,
          },
          types: undefined,
          status: [WorkStatus.FAILED],
        })
      ).filter((workItem) => workItem.type !== ErrorNotifications.type && workItem.retries === 0);

      if (!workItems.length) {
        return { success: true, result: {} };
      }

      const message = await context.modules.worker.addWork({
        type: 'MESSAGE',
        retries: 0,
        input: {
          workItems,
          template: 'ERROR_REPORT',
        },
        originalWorkId: workId,
      });

      return {
        success: true,
        result: { forked: message._id },
      };
    } catch (err) {
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(ErrorNotifications);

export default ErrorNotifications;

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
WorkerDirector.configureAutoscheduling({
  type: ErrorNotifications.type,
  schedule: everyDayAtFourInTheNight,
  input: async () => ({ secondsPassed: ONE_DAY_IN_SECONDS }),
  retries: 0,
});
