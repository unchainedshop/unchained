import { WorkerDirector } from '@unchainedshop/core-worker';

export const generateWorkerTypeDefs = () => {
  return [
    /* GraphQL */ `
    extend enum WorkType {
      ${WorkerDirector.getActivePluginTypes().join(',')}
    }
  `,
  ];
};
