import { MessagingDirector, type IWorkerAdapter, WorkerAdapter, WorkerDirector } from '@unchainedshop/core';
import type { Work } from '@unchainedshop/core-worker';

export const MessageWorker: IWorkerAdapter<
  { template: string; _id: string; [x: string]: any },
  { info?: string; forked?: Work[] }
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.message',
  label: 'Send Message by combining payload with a template and start concrete jobs',
  version: '1.0.0',
  type: 'MESSAGE',

  doWork: async ({ template, ...payload }, unchainedAPI, workId) => {
    try {
      const templateResolver = MessagingDirector.getTemplate(template);

      if (!templateResolver) throw new Error(`No template resolver found for template ${template}`);

      const workConfigurations = await templateResolver(
        {
          template,
          ...payload,
        },
        unchainedAPI,
      );

      if (workConfigurations.length > 0) {
        const forked = await Promise.all(
          workConfigurations.map(async (workConfiguration: any) => {
            const work = await unchainedAPI.modules.worker.addWork({
              ...workConfiguration,
              originalWorkId: workId,
            });
            delete (work as any).input; // Remove input from returned work for privacy
            return work;
          }),
        );
        return { success: true, result: { forked } };
      }
      return { success: true, result: { forked: [] } };
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

WorkerDirector.registerAdapter(MessageWorker);
