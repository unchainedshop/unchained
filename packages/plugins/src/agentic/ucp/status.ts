import type { Order } from '@unchainedshop/core-orders';

export const CHECKOUT_TTL = 6 * 60 * 60 * 1000;

export const expiresAt = (order: Order) => new Date(order.created.getTime() + CHECKOUT_TTL);

export const isClosed = (order: Order) =>
  order.status !== null || Boolean(order.context?.ucp?.canceled) || expiresAt(order) < new Date();

export type CheckoutStatus =
  | 'incomplete'
  | 'requires_escalation'
  | 'ready_for_complete'
  | 'complete_in_progress'
  | 'completed'
  | 'canceled';

export interface UcpMessage {
  type: 'error' | 'warning' | 'info';
  code: string;
  content: string;
  path?: string;
  severity?: 'recoverable' | 'requires_buyer_input' | 'requires_buyer_review' | 'unrecoverable';
}

export const recoverable = (code: string, path: string | undefined, content: string): UcpMessage => ({
  type: 'error',
  code,
  content,
  severity: 'recoverable',
  ...(path && { path }),
});

export const warning = (code: string, path: string | undefined, content: string): UcpMessage => ({
  type: 'warning',
  code,
  content,
  ...(path && { path }),
});

export const buyerInput = (code: string, content: string): UcpMessage => ({
  type: 'error',
  code,
  content,
  severity: 'requires_buyer_input',
});

export const unrecoverable = (code: string, content: string): UcpMessage => ({
  type: 'error',
  code,
  content,
  severity: 'unrecoverable',
});

export function checkoutStatus({
  placed,
  canceled,
  expired,
  attempt,
  escalations,
  missing,
}: {
  placed: boolean;
  canceled: boolean;
  expired: boolean;
  attempt: boolean;
  escalations: UcpMessage[];
  missing: UcpMessage[];
}): CheckoutStatus {
  if (placed) return 'completed';
  if (canceled || expired) return 'canceled';
  if (attempt) return 'complete_in_progress';
  if (escalations.length) return 'requires_escalation';
  if (missing.length) return 'incomplete';
  return 'ready_for_complete';
}
