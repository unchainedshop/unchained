import { type IPlugin } from '@unchainedshop/core';
import { BudgetSMSWorker } from './adapter.ts';

// Plugin definition
export const BudgetSMSPlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.budgetsms',
  label: 'Budget SMS Worker Plugin',
  version: '1.0.0',

  adapters: [BudgetSMSWorker],
};

export default BudgetSMSPlugin;

// Re-export adapter for direct use
export { BudgetSMSWorker, checkBudgetSmsCredentials } from './adapter.ts';
