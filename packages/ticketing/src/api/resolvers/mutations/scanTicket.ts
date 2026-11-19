import type { Context, GraphQLResolveInfo } from '@unchainedshop/api';
import { InvalidIdError, TokenNotFoundError } from '@unchainedshop/api';
import type { Product } from '@unchainedshop/core-products';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';
import { timingSafeStringEqual } from '@unchainedshop/utils';
import { assertTicketEventInScope, isActiveTicketEvent } from '../../roles.ts';
import {
  TicketAccessKeyInvalidError,
  TicketAlreadyRedeemedError,
  TicketCanceledError,
  TicketNotRedeemableError,
  TicketWrongEventError,
} from '../../errors.ts';
import {
  getTicketEventDetails,
  getTicketEventStart,
  isTicketCancelled,
  isTicketEventCancelled,
} from '../../../event-details.ts';
import { TicketNotRedeemableReason, explainEntryRefusal } from '../../../entry-window.ts';
import { TicketingEventTypes, emitTicketingEvent } from '../../../events.ts';
import {
  TICKET_WAREHOUSING_ADAPTER_KEY,
  readTicketConfiguration,
} from '../../../warehousing/ticket/adapter.ts';

export { TicketNotRedeemableReason };

// Tells gate staff when the entrance opens or closed, as far as the ticket issuer decides it.
async function explainRefusal(product: Product, context: Context, now: Date) {
  const { startsAt } = getTicketEventDetails(product);
  const providers = await context.modules.warehousing.allProviders();
  const issuer = providers.find(
    ({ type, adapterKey }) =>
      type === WarehousingProviderType.VIRTUAL && adapterKey === TICKET_WAREHOUSING_ADAPTER_KEY,
  );
  const refusal =
    issuer &&
    explainEntryRefusal(readTicketConfiguration(issuer.configuration), {
      start: getTicketEventStart(product),
      referenceDate: now,
    });
  return { reason: TicketNotRedeemableReason.NOT_REDEEMABLE, ...refusal, startsAt };
}

const cancellationOf = (token: any, product: Product | null) => {
  if (isTicketCancelled(token)) {
    return { scope: 'TICKET', cancelledDate: token.meta?.cancelledDate };
  }
  if (isTicketEventCancelled(product)) {
    return { scope: 'EVENT', cancelledDate: product?.meta?.cancelledDate };
  }
  return null;
};

/**
 * Redeems a ticket at the gate. productId is the event the gate admits. Refusals carry a code
 * gate staff can act on, in this order: wrong event, cancelled (a cancelled ticket also has an
 * invalidatedDate, so this comes before redeemed), already redeemed, not redeemable now.
 */
export default async function scanTicket(
  _root: never,
  {
    tokenId,
    productId,
    accessKey,
  }: { tokenId: string; productId?: string | null; accessKey?: string | null },
  context: Context,
  info: GraphQLResolveInfo,
) {
  const { modules, services, userId } = context;
  log(`mutation scanTicket ${tokenId}`, { userId, productId });
  if (!tokenId) throw new InvalidIdError({ tokenId });
  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) throw new TokenNotFoundError({ tokenId });
  const product = await modules.products.findProduct({ productId: token.productId });

  // Organizer scope first, so staff learn nothing about the tickets of events outside it.
  await assertTicketEventInScope(product, context, 'scanTicket', info);
  // The access key depends on the current holder, so a QR code issued before a transfer no longer
  // matches. Typed codes (serials, names) carry no key and rely on the staff member's judgement.
  if (
    accessKey !== undefined &&
    accessKey !== null &&
    !(await timingSafeStringEqual(accessKey, await modules.warehousing.buildAccessKeyFromToken(token)))
  ) {
    throw new TicketAccessKeyInvalidError({ tokenId, productId: token.productId });
  }
  if (productId && token.productId !== productId) {
    throw new TicketWrongEventError({
      tokenId,
      productId: token.productId,
      expectedProductId: productId,
    });
  }
  const cancellation = cancellationOf(token, product);
  if (cancellation) {
    throw new TicketCanceledError({ tokenId, productId: token.productId, ...cancellation });
  }
  if (token.invalidatedDate) {
    throw new TicketAlreadyRedeemedError({
      tokenId,
      productId: token.productId,
      invalidatedDate: token.invalidatedDate,
    });
  }
  if (!isActiveTicketEvent(product)) {
    throw new TicketNotRedeemableError({
      tokenId,
      productId: token.productId,
      reason: TicketNotRedeemableReason.EVENT_INACTIVE,
    });
  }
  const now = new Date();
  if (!(await services.warehousing.isTokenInvalidateable({ token, product }))) {
    throw new TicketNotRedeemableError({
      tokenId,
      productId: token.productId,
      ...(await explainRefusal(product, context, now)),
    });
  }

  // The update only matches tokens that are not invalidated yet, so a concurrent scan at another
  // gate, or a cancellation that already invalidated the ticket, loses here and is reported with
  // the current state.
  const redeemedToken = await modules.warehousing.invalidateToken(tokenId);
  if (!redeemedToken) {
    const current = await modules.warehousing.findToken({ tokenId });
    const cancelled = cancellationOf(current, product);
    if (cancelled) {
      throw new TicketCanceledError({ tokenId, productId: token.productId, ...cancelled });
    }
    throw new TicketAlreadyRedeemedError({
      tokenId,
      productId: token.productId,
      invalidatedDate: current?.invalidatedDate,
    });
  }
  // A cancellation marks the ticket cancelled before it invalidates it. If that mark landed after
  // the checks above, the update still matched: the returned ticket shows it, so it is refused.
  // The invalidation only did what the cancellation was about to do.
  const cancelledMeanwhile = cancellationOf(redeemedToken, product);
  if (cancelledMeanwhile) {
    throw new TicketCanceledError({ tokenId, productId: token.productId, ...cancelledMeanwhile });
  }

  await emitTicketingEvent(TicketingEventTypes.TICKET_REDEEMED, {
    token: redeemedToken,
    redeemedBy: userId,
  });
  return redeemedToken;
}
