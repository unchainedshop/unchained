import { type IPlugin } from '@unchainedshop/core';
import { AuditLogPrune } from './adapter.ts';

export const AuditLogPrunePlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.audit-log-prune',
  label: 'Audit Log Prune Worker Plugin',
  version: '1.0.0',

  adapters: [AuditLogPrune],
};

export default AuditLogPrunePlugin;

export { AuditLogPrune, configureAuditLogPruneAutoscheduling } from './adapter.ts';
