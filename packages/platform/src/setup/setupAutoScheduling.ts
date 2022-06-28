import { configureGenerateOrderAutoscheduling } from '@unchainedshop/plugins/lib/worker/GenerateOrderWorker';

export const setupAutoScheduling = () => {
  configureGenerateOrderAutoscheduling();
};
