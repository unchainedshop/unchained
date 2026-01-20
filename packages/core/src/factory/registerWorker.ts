import { WorkerAdapter, type IPlugin, type IWorkerAdapter } from '../core-index.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

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
}): IPlugin {
  const adapter: IWorkerAdapter<Input, Result> = {
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
  };

  const plugin: IPlugin = {
    key: adapter.key,
    label: adapter.label,
    version: adapter.version,
    adapters: [adapter],
  };

  pluginRegistry.register(plugin);
  return plugin;
}
