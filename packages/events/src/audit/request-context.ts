import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuditRequestContext {
  userId?: string;
  userName?: string;
  remoteAddress?: string;
  sessionId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<AuditRequestContext>();

export function runWithAuditContext<T>(context: AuditRequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

export function getAuditContext(): AuditRequestContext | undefined {
  return asyncLocalStorage.getStore();
}
