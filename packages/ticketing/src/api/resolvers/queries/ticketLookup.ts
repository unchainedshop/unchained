import type { Context } from '@unchainedshop/api';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';
import { canWorkWithTicketEvent } from '../../roles.ts';
import { parseTicketScanPayload } from '../../../scan-payload.ts';

const MAX_LOOKUP_RESULTS = 100;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Resolves a code typed or scanned at the gate to tickets: a token id (bare or inside a ticket QR
 * code), a serial or an attendee name within productId, or an order number. Serials repeat across
 * events and names are only meaningful within one, so both need productId. Cancelled and redeemed
 * tickets are returned as well; only tickets of events the viewer may work with are returned.
 */
export default async function ticketLookup(
  _root: never,
  { code, productId, limit = 10 }: { code: string; productId?: string | null; limit?: number | null },
  context: Context,
): Promise<TokenSurrogate[]> {
  const { modules, loaders, userId } = context;
  log('query ticketLookup', { userId, productId });
  const text = code?.trim();
  if (!text) return [];
  const max = Math.min(Math.max(limit ?? 10, 1), MAX_LOOKUP_RESULTS);

  const isVisible = async (token: TokenSurrogate) =>
    canWorkWithTicketEvent(await loaders.productLoader.load({ productId: token.productId }), context);

  // A token id identifies exactly one ticket, whatever else the code might match.
  const payload = parseTicketScanPayload(text);
  const ticket = payload && (await modules.warehousing.findToken({ tokenId: payload.tokenId }));
  if (ticket) return (await isVisible(ticket)) ? [ticket] : [];

  const candidates: TokenSurrogate[] = [];
  if (productId) {
    candidates.push(
      ...(await modules.warehousing.findTokens(
        { productId, tokenSerialNumber: text.replace(/^#/, '') },
        { limit: max },
      )),
    );
  }
  const order = await modules.orders.findOrder({ orderNumber: text });
  if (order) {
    const positions = await modules.orders.positions.findOrderPositions({ orderId: order._id });
    if (positions.length) {
      candidates.push(
        ...(await modules.warehousing.findTokens(
          { orderPositionId: { $in: positions.map(({ _id }) => _id) } },
          { limit: max },
        )),
      );
    }
  }
  if (productId) {
    // The attendee name is what the ticket issuer's ticketMeta hook stored, never user data.
    candidates.push(
      ...(await modules.warehousing.findTokens(
        { productId, 'meta.attendeeName': { $regex: escapeRegExp(text), $options: 'i' } },
        { limit: max, sort: { 'meta.attendeeName': 1, _id: 1 } },
      )),
    );
  }

  const unique = [...new Map(candidates.map((token) => [token._id, token])).values()];
  const visible = await Promise.all(unique.map(isVisible));
  return unique.filter((_, index) => visible[index]).slice(0, max);
}
