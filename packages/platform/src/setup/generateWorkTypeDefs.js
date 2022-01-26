import { WorkerDirector } from 'meteor/unchained:core-worker';

export const generateWorkerTypeDefs = () => {
  return [
    /* GraphQL */ `
    extend enum WorkType {
      ${WorkerDirector.getActivePluginTypes().join(',')}
    }
  `,
  ];
};
