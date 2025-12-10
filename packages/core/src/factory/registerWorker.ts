import { WorkerAdapter, WorkerDirector } from '../core-index.ts';

export default function registerWorker<Input = any, Result = any>({
  type,
  external,
  maxParallelAllocations,
  process,
}: {
  type: string;
  external?: boolean;
  maxParallelAllocations?: number;
  process?: (input: Input, workId: string) => Promise<Result>;
}) {
  WorkerDirector.registerAdapter({
    ...WorkerAdapter,

    key: 'shop.unchained.worker.' + type.toLowerCase(),
    label: 'Worker: ' + type,
    version: '1.0',
    external: external ?? false,
    maxParallelAllocations,
    type,

    async doWork(input, _, workId) {
      if (!process) {
        return { success: false };
      }
      try {
        const result = await process(input, workId);
        return {
          success: true,
          result,
        };
      } catch (err) {
        return {
          success: false,
          error: {
            name: err.name,
            message: err.message,
            cause: err.cause,
          },
        };
      }
    },
  });
}
