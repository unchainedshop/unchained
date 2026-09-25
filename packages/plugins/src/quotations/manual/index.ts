import { type IPlugin } from '@unchainedshop/core';
import { ManualOffering } from './adapter.ts';

// Plugin definition
export const ManualOfferingPlugin: IPlugin = {
  key: 'shop.unchained.quotations.manual',
  label: 'Manual Offering Quotation Plugin',
  version: '1.0.0',

  adapters: [ManualOffering],
};

export default ManualOfferingPlugin;
