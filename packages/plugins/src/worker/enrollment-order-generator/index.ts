import { type IPlugin } from '@unchainedshop/core';
import { GenerateOrderWorker, configureGenerateOrderAutoscheduling } from './adapter.ts';

// Plugin definition
export const EnrollmentOrderGeneratorPlugin: IPlugin = {
  key: 'shop.unchained.worker.enrollment-order-generator',
  label: 'Enrollment Order Generator Worker Plugin',
  version: '1.0.0',

  adapters: [GenerateOrderWorker],

  onRegister: () => {
    configureGenerateOrderAutoscheduling();
  },
};

export default EnrollmentOrderGeneratorPlugin;

// Re-export adapter for direct use
export { GenerateOrderWorker, configureGenerateOrderAutoscheduling } from './adapter.ts';
