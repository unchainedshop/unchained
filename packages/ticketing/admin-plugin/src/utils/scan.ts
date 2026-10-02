// What the gate shows for a scanned or looked-up ticket. Pure, so it runs in node --test.
import { parseTicketScanPayload } from '../../../src/scan-payload.ts';

export const TicketVerdict = {
  /** Can be redeemed at this gate. */
  VALID: 'VALID',
  /** Redeemed by this gate just now. */
  ADMITTED: 'ADMITTED',
  ALREADY_REDEEMED: 'ALREADY_REDEEMED',
  CANCELLED: 'CANCELLED',
  WRONG_EVENT: 'WRONG_EVENT',
  /** Event inactive or outside the entry window. */
  NOT_REDEEMABLE: 'NOT_REDEEMABLE',
  NOT_FOUND: 'NOT_FOUND',
  /** The camera read a QR code that holds no ticket. */
  NOT_A_TICKET: 'NOT_A_TICKET',
  /** The QR code's access key does not match the ticket: issued before a transfer, or forged. */
  INVALID_CODE: 'INVALID_CODE',
  /** Event outside the viewer's permissions, or the session expired. */
  NO_PERMISSION: 'NO_PERMISSION',
  ERROR: 'ERROR',
} as const;

export type TicketVerdict = (typeof TicketVerdict)[keyof typeof TicketVerdict];

export interface TicketCheck {
  verdict: TicketVerdict;
  /** Redeemed or cancelled at */
  date?: string;
  scope?: 'TICKET' | 'EVENT';
  /** TicketNotRedeemableReason of scanTicket */
  reason?: string;
  startsAt?: string;
  opensAt?: string;
  closesAt?: string;
  /** The event the ticket belongs to (wrong event) */
  productId?: string;
  message?: string;
}

export interface GateTicket {
  _id: string;
  tokenSerialNumber?: string | null;
  quantity?: number | null;
  ticketStatus?: string | null;
  invalidatedDate?: string | null;
  cancelledDate?: string | null;
  isInvalidateable?: boolean | null;
  attendeeName?: string | null;
  user?: { _id: string; name?: string | null } | null;
  product?: {
    _id: string;
    status?: string | null;
    event?: {
      isCanceled?: boolean | null;
      startsAt?: string | null;
      category?: string | null;
      categoryTitle?: string | null;
    } | null;
    texts?: { title?: string | null } | null;
  } | null;
}

/**
 * The events a gate admits. One performance may be sold as several products (a ticket category
 * or seating area each), so a gate can admit several; none admits the tickets of any event.
 */
export interface GateEvents {
  eventIds?: string[] | null;
}

const admitsEvent = ({ eventIds }: GateEvents, productId?: string | null) =>
  !eventIds?.length || Boolean(productId && eventIds.includes(productId));

// Leaves out empty values so the result only holds what can be shown.
const compact = (check: Record<string, unknown>): TicketCheck =>
  Object.fromEntries(
    Object.entries(check).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as unknown as TicketCheck;

/**
 * Judges a ticket returned by ticketLookup in the order scanTicket refuses it: wrong event,
 * cancelled (a cancelled ticket carries an invalidatedDate too), redeemed, not redeemable now.
 * scanTicket stays the authority; this only decides what the gate shows before redeeming.
 */
export function checkTicket(ticket: GateTicket, gate: GateEvents): TicketCheck {
  const product = ticket.product;
  if (product?._id && !admitsEvent(gate, product._id)) {
    return { verdict: TicketVerdict.WRONG_EVENT, productId: product._id };
  }
  if (ticket.ticketStatus === 'CANCELLED') {
    return compact({ verdict: TicketVerdict.CANCELLED, scope: 'TICKET', date: ticket.cancelledDate });
  }
  if (product?.event?.isCanceled) return { verdict: TicketVerdict.CANCELLED, scope: 'EVENT' };
  if (ticket.ticketStatus === 'REDEEMED') {
    return compact({ verdict: TicketVerdict.ALREADY_REDEEMED, date: ticket.invalidatedDate });
  }
  if (product?.status && product.status !== 'ACTIVE') {
    return { verdict: TicketVerdict.NOT_REDEEMABLE, reason: 'EVENT_INACTIVE' };
  }
  if (ticket.isInvalidateable === false) {
    return compact({ verdict: TicketVerdict.NOT_REDEEMABLE, startsAt: product?.event?.startsAt });
  }
  return { verdict: TicketVerdict.VALID };
}

const firstGraphQLError = (error: any) => error?.errors?.[0] ?? error?.graphQLErrors?.[0];

/** Maps a failed scanTicket or ticketLookup call (Apollo error) to what the gate shows. */
export function describeScanError(error: unknown): TicketCheck {
  const graphQLError = firstGraphQLError(error);
  const { code, ...data } = graphQLError?.extensions ?? {};
  switch (code) {
    case 'TicketWrongEventError':
      return compact({ verdict: TicketVerdict.WRONG_EVENT, productId: data.productId });
    case 'TicketCanceledError':
      return compact({ verdict: TicketVerdict.CANCELLED, scope: data.scope, date: data.cancelledDate });
    case 'TicketAlreadyRedeemedError':
      return compact({ verdict: TicketVerdict.ALREADY_REDEEMED, date: data.invalidatedDate });
    case 'TicketNotRedeemableError':
      return compact({
        verdict: TicketVerdict.NOT_REDEEMABLE,
        reason: data.reason,
        startsAt: data.startsAt,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
      });
    case 'TicketAccessKeyInvalidError':
      return { verdict: TicketVerdict.INVALID_CODE };
    case 'NoPermissionError':
      return { verdict: TicketVerdict.NO_PERMISSION };
    case 'TokenNotFoundError':
    case 'InvalidIdError':
      return { verdict: TicketVerdict.NOT_FOUND };
    default:
      return compact({
        verdict: TicketVerdict.ERROR,
        message: graphQLError?.message ?? (error as Error)?.message,
      });
  }
}

export type ScanTone = 'ok' | 'warn' | 'error';

/** Sound and colour of a result: go, look again, stop. */
export function getScanTone({ verdict }: Pick<TicketCheck, 'verdict'>): ScanTone {
  if (verdict === TicketVerdict.VALID || verdict === TicketVerdict.ADMITTED) return 'ok';
  if (verdict === TicketVerdict.ALREADY_REDEEMED || verdict === TicketVerdict.NOT_REDEEMABLE)
    return 'warn';
  return 'error';
}

/**
 * Cameras read the same QR code many times per second while it is held up. The guard lets a code
 * pass once and ignores it until it has been out of view for windowMs; a different code passes
 * at once.
 */
export function createRepeatGuard(windowMs: number, now: () => number = Date.now) {
  let last: { key: string; seenAt: number } | null = null;
  const guard = (key: string) => {
    const time = now();
    if (last?.key === key && time - last.seenAt < windowMs) {
      last.seenAt = time;
      return false;
    }
    last = { key, seenAt: time };
    return true;
  };
  guard.reset = () => {
    last = null;
  };
  return guard;
}

/**
 * How the gate found a ticket. QR_CODE: the code is a ticket QR code (ticket id and access key)
 * and names this very ticket. SEARCH: a serial, name, order number or bare id matched, or staff
 * picked the ticket; that proves nothing about who holds the ticket.
 */
export type GateMatch = 'QR_CODE' | 'SEARCH';

export interface GateOutcome<T extends GateTicket = GateTicket> {
  /** The code that was checked (trimmed), or the ticket id when redeeming */
  code: string;
  check?: TicketCheck;
  ticket?: T;
  matchedBy?: GateMatch;
  /** Access key of the ticket QR code (matchedBy QR_CODE), sent along when redeeming */
  accessKey?: string;
  /** Several tickets matched a typed code: the gate picks one */
  candidates?: T[];
}

export interface GateApi<T extends GateTicket = GateTicket> {
  lookupTickets(input: { code: string; productId?: string | null }): Promise<T[]>;
  redeemTicket(input: {
    tokenId: string;
    productId?: string | null;
    accessKey?: string | null;
  }): Promise<T | null | undefined>;
}

/**
 * Redeems through scanTicket; a refusal is explained, never thrown. scanTicket gets the ticket's
 * own event when the gate admits it, else the gate's first event, so the server refuses tickets
 * of other events as well. accessKey (from a ticket QR code) lets the server refuse outdated or
 * forged codes.
 */
export async function redeemGateTicket<T extends GateTicket>(
  ticket: T,
  gate: GateEvents,
  api: Pick<GateApi<T>, 'redeemTicket'>,
  { accessKey }: { accessKey?: string | null } = {},
): Promise<GateOutcome<T>> {
  const ownEvent = ticket.product?._id;
  const productId = ownEvent && admitsEvent(gate, ownEvent) ? ownEvent : (gate.eventIds?.[0] ?? null);
  try {
    const redeemed = await api.redeemTicket({
      tokenId: ticket._id,
      productId,
      ...(accessKey ? { accessKey } : {}),
    });
    return { code: ticket._id, ticket: redeemed || ticket, check: { verdict: TicketVerdict.ADMITTED } };
  } catch (error) {
    return { code: ticket._id, ticket, check: describeScanError(error) };
  }
}

// Serials and names repeat across events, so typed codes are searched in each event of the gate.
async function lookupTyped<T extends GateTicket>(code: string, gate: GateEvents, api: GateApi<T>) {
  const productIds = gate.eventIds?.length ? gate.eventIds : [null];
  const results = await Promise.all(
    productIds.map((productId) => api.lookupTickets({ code, productId })),
  );
  return [...new Map(results.flat().map((ticket) => [ticket._id, ticket])).values()];
}

/**
 * Checks a scanned or typed code at the gate: looks the tickets up (ticketLookup), judges a single
 * match with checkTicket and, with autoRedeem, redeems it at once when it is valid and the code is
 * a ticket QR code naming it.
 *
 * Serials are printed on the tickets and run from 1, names and order numbers are no secret, so a
 * QR code holding one of them must not stand in for the ticket. Camera codes are therefore only
 * taken when they carry a ticket id and an access key (every ticket QR code does), and only the
 * ticket with that id counts; ticketLookup's serial, name and order number matches are dropped.
 * Typed codes are searched by serial, name and order number too, but only a typed ticket QR code
 * (barcode readers type them) is redeemed at once; other matches wait for staff (matchedBy
 * SEARCH). Only the server can verify the access key itself. Returns null for a blank code.
 */
export async function checkTicketCode<T extends GateTicket>(
  {
    code: rawCode,
    eventIds,
    fromCamera = false,
    autoRedeem = false,
  }: { code: string; fromCamera?: boolean; autoRedeem?: boolean } & GateEvents,
  api: GateApi<T>,
): Promise<GateOutcome<T> | null> {
  const code = rawCode?.trim();
  if (!code) return null;
  const gate = { eventIds };
  const payload = parseTicketScanPayload(code);
  const qrCode = payload?.accessKey ? payload : null;
  if (fromCamera && !qrCode) {
    return { code, check: { verdict: TicketVerdict.NOT_A_TICKET } };
  }

  let tickets: T[];
  try {
    if (fromCamera) {
      // Without an event the server does not even search serials or names.
      const found = await api.lookupTickets({ code, productId: null });
      tickets = found.filter(({ _id }) => _id === qrCode.tokenId);
    } else {
      tickets = await lookupTyped(code, gate, api);
    }
  } catch (error) {
    return { code, check: describeScanError(error) };
  }
  if (!tickets.length) return { code, check: { verdict: TicketVerdict.NOT_FOUND } };
  if (tickets.length > 1) {
    const ofThisGate = (ticket: T) => (admitsEvent(gate, ticket.product?._id) ? 0 : 1);
    return { code, candidates: [...tickets].sort((a, b) => ofThisGate(a) - ofThisGate(b)) };
  }

  const [ticket] = tickets;
  const matchedBy: GateMatch = qrCode?.tokenId === ticket._id ? 'QR_CODE' : 'SEARCH';
  const accessKey = matchedBy === 'QR_CODE' ? qrCode?.accessKey : undefined;
  const qrAccessKey = accessKey ? { accessKey } : {};
  const check = checkTicket(ticket, gate);
  if (autoRedeem && matchedBy === 'QR_CODE' && check.verdict === TicketVerdict.VALID) {
    return {
      ...(await redeemGateTicket(ticket, gate, api, { accessKey })),
      code,
      matchedBy,
      ...qrAccessKey,
    };
  }
  return { code, ticket, check, matchedBy, ...qrAccessKey };
}
