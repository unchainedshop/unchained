import { emit, registerEvents } from '@unchainedshop/events';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';

/**
 * Ticketing events, emitted in addition to the core TOKEN_INVALIDATED (which fires for redemptions
 * and cancellations alike). Subscribe to TICKET_REDEEMED for check-in side effects.
 */
export const TicketingEventTypes = {
  /** A ticket was redeemed at the gate through scanTicket. */
  TICKET_REDEEMED: 'TICKET_REDEEMED',
  /** A ticket was cancelled, on its own or with its event. */
  TICKET_CANCELLED: 'TICKET_CANCELLED',
  /** An event was cancelled; one TICKET_CANCELLED per ticket precedes it. */
  TICKET_EVENT_CANCELLED: 'TICKET_EVENT_CANCELLED',
} as const;

export type TicketingEventTypes = (typeof TicketingEventTypes)[keyof typeof TicketingEventTypes];

export interface TicketRedeemedEventPayload {
  token: TokenSurrogate;
  /** The user id of the gate staff member who scanned the ticket. */
  redeemedBy?: string;
}

export interface TicketCancelledEventPayload {
  /** The cancelled ticket; `invalidatedDate` before `meta.cancelledDate` means it had been redeemed. */
  token: TokenSurrogate;
}

export interface TicketEventCancelledEventPayload {
  productId: string;
  cancelledCount: number;
}

export interface TicketingEventPayloads {
  [TicketingEventTypes.TICKET_REDEEMED]: TicketRedeemedEventPayload;
  [TicketingEventTypes.TICKET_CANCELLED]: TicketCancelledEventPayload;
  [TicketingEventTypes.TICKET_EVENT_CANCELLED]: TicketEventCancelledEventPayload;
}

/** Registers the ticketing events; the passes module does this when it is configured. */
export const registerTicketingEvents = () => {
  registerEvents(Object.values(TicketingEventTypes));
};

export async function emitTicketingEvent<T extends TicketingEventTypes>(
  type: T,
  payload: TicketingEventPayloads[T],
): Promise<void> {
  // Registering is idempotent. Doing it here as well keeps an already written redemption or
  // cancellation from failing on an unregistered event when the passes module was not set up.
  registerTicketingEvents();
  await emit(type, payload as unknown as Record<string, unknown>);
}
