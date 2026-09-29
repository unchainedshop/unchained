import type { Context } from '@unchainedshop/api';
import type { Order as OrderType } from '@unchainedshop/core-orders';
import { timingSafeStringEqual } from '@unchainedshop/utils';
import { isAdministrator } from '../../roles.ts';
import { buildTicketsPdfUrl } from '../../../ticket-delivery.ts';
import type { TicketingAPI } from '../../../index.ts';

type TicketingContext = Context & Partial<Pick<TicketingAPI, 'modules'>>;

const decisionsByRequest = new WeakMap<Context, Map<string, Promise<boolean>>>();

// The magic key opens the order and its tickets (viewToken, updateToken) without a session and
// never expires, so it is only handed to the owner, administrators and whoever presented it.
async function mayReadMagicKey(order: OrderType, context: TicketingContext): Promise<boolean> {
  if (!order.status || !context.modules?.passes) return false;
  if (order.userId && order.userId === context.userId) return true;
  if (isAdministrator(context)) return true;
  const presented = context.getHeader?.('x-magic-key');
  if (typeof presented !== 'string' || !presented) return false;
  return timingSafeStringEqual(await context.modules.passes.buildMagicKey(order._id), presented);
}

// Both fields need the same decision; take it once per request and order.
function mayReadMagicKeyOnce(order: OrderType, context: TicketingContext): Promise<boolean> {
  if (!decisionsByRequest.has(context)) decisionsByRequest.set(context, new Map());
  const decisions = decisionsByRequest.get(context)!;
  if (!decisions.has(order._id)) decisions.set(order._id, mayReadMagicKey(order, context));
  return decisions.get(order._id)!;
}

export const Order = {
  async magicKey(order: OrderType, _params: never, context: TicketingContext): Promise<string | null> {
    if (!(await mayReadMagicKeyOnce(order, context))) return null;
    return context.modules!.passes.buildMagicKey(order._id);
  },

  async ticketsPdfUrl(
    order: OrderType,
    { variant }: { variant?: string | null },
    context: TicketingContext,
  ): Promise<string | null> {
    // The link carries the magic key, so it follows the same rule.
    if (!(await mayReadMagicKeyOnce(order, context))) return null;
    return buildTicketsPdfUrl(order._id, context as unknown as TicketingAPI, {
      variant: variant || undefined,
    });
  },
};
