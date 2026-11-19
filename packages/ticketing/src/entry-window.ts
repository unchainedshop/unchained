const MINUTE = 60_000;

const isBound = (minutes?: number | null): minutes is number =>
  minutes !== undefined && minutes !== null;

/** Why a ticket that is neither cancelled nor redeemed cannot be redeemed now. */
export const TicketNotRedeemableReason = {
  /** The event is missing, not a ticket event or not active. */
  EVENT_INACTIVE: 'EVENT_INACTIVE',
  /** The entry window of the ticket issuer has not opened yet. */
  NOT_YET_OPEN: 'NOT_YET_OPEN',
  /** The entry window of the ticket issuer has closed. */
  ENTRY_CLOSED: 'ENTRY_CLOSED',
  /** The warehousing adapter refused for another reason. */
  NOT_REDEEMABLE: 'NOT_REDEEMABLE',
} as const;

export interface EntryWindow {
  opensMinutesBefore?: number | null;
  closesMinutesAfter?: number | null;
  entryWindowValid?: boolean;
}

/**
 * Why the entry window refuses a ticket at `referenceDate`, with its bounds; null while it admits
 * it. The window runs from `opensMinutesBefore` the event start until `closesMinutesAfter` it, both
 * bounds included, and a missing bound leaves that side open. Tickets without an event start are
 * always admitted; an invalid window, start or reference date never. Computed in absolute time, so
 * daylight saving switches do not shift the window.
 */
export function explainEntryRefusal(
  { opensMinutesBefore, closesMinutesAfter, entryWindowValid = true }: EntryWindow,
  { start, referenceDate }: { start?: Date | null; referenceDate: Date },
) {
  if (!entryWindowValid) return { reason: TicketNotRedeemableReason.NOT_REDEEMABLE };
  if (!start) return null;
  const startTime = start.getTime();
  const now = referenceDate.getTime();
  if (Number.isNaN(startTime) || Number.isNaN(now)) {
    return { reason: TicketNotRedeemableReason.NOT_REDEEMABLE };
  }
  const opensAt = isBound(opensMinutesBefore)
    ? new Date(startTime - opensMinutesBefore * MINUTE)
    : undefined;
  const closesAt = isBound(closesMinutesAfter)
    ? new Date(startTime + closesMinutesAfter * MINUTE)
    : undefined;
  if (opensAt && now < opensAt.getTime()) {
    return { reason: TicketNotRedeemableReason.NOT_YET_OPEN, opensAt, closesAt };
  }
  if (closesAt && now > closesAt.getTime()) {
    return { reason: TicketNotRedeemableReason.ENTRY_CLOSED, opensAt, closesAt };
  }
  return null;
}

/** Whether a ticket may be redeemed at `referenceDate` (see explainEntryRefusal). */
export function isWithinEntryWindow({
  start,
  referenceDate,
  ...entryWindow
}: EntryWindow & { start?: Date | null; referenceDate: Date }): boolean {
  return !explainEntryRefusal(entryWindow, { start, referenceDate });
}
