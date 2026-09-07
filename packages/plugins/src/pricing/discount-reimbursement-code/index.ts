import { type IPlugin } from '@unchainedshop/core';
import { ReimbursementCode } from './adapter.ts';

export const ReimbursementCodePlugin: IPlugin = {
  key: 'shop.unchained.discount.reimbursement-code',
  label: 'Reimbursement Code Discount Plugin',
  version: '1.0.0',

  adapters: [ReimbursementCode],
};

export default ReimbursementCodePlugin;

export { ReimbursementCode } from './adapter.ts';
