import { IWorkerAdapter, Work } from '@unchainedshop/types/worker';
import { MessagingDirector } from '@unchainedshop/core-messaging';
import { WorkerAdapter, WorkerDirector } from '@unchainedshop/core-worker';
import { createLogger } from '@unchainedshop/logger';
import { Context } from '@unchainedshop/types/api';

export const messagingLogger = createLogger('unchained:core-messaging');

export const MessageWorker: IWorkerAdapter<
  { template: string; _id?: string; [x: string]: any },
  { info?: string; forked?: Array<Work> }
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.message',
  label: 'Send Message by combining payload with a template and start concrete jobs',
  version: '1.0',
  type: 'MESSAGE',

  doWork: async ({ template, ...payload }, requestContext, workId) => {
    try {
      const templateResolver = MessagingDirector.getTemplate(template);

      const workConfigurations = await templateResolver(
        {
          template,
          ...payload,
        },
        requestContext as Context, // TODO: Type Refactor
      );

      if (workConfigurations.length > 0) {
        const forked = await Promise.all(
          workConfigurations.map(async (workConfiguration: any) => {
            const work = await requestContext.modules.worker.addWork(
              {
                ...workConfiguration,
                originalWorkId: workId,
              },
              null,
            );
            delete work.input;
            return work;
          }),
        );
        return { success: true, result: { forked } };
      }
      return { success: true, result: { info: 'Skipped Message' } };
    } catch (err) {
      messagingLogger.warn(err.stack);
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

WorkerDirector.registerAdapter(MessageWorker);
