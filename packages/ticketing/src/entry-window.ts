const MINUTE = 60_000;

const isBound = (minutes?: number | null): minutes is number =>
  minutes !== undefined && minutes !== null;

/**
 * Whether a ticket may be redeemed at `referenceDate`: from `opensMinutesBefore` the event start
 * until `closesMinutesAfter` it, both bounds included. A missing bound leaves that side open.
 * Tickets without an event start can always be redeemed; an invalid start or reference date never.
 * Computed in absolute time, so daylight saving switches do not shift the window.
 */
export function isWithinEntryWindow({
  start,
  referenceDate,
  opensMinutesBefore,
  closesMinutesAfter,
}: {
  start?: Date | null;
  referenceDate: Date;
  opensMinutesBefore?: number | null;
  closesMinutesAfter?: number | null;
}): boolean {
  if (!start) return true;
  const startTime = start.getTime();
  const now = referenceDate.getTime();
  if (Number.isNaN(startTime) || Number.isNaN(now)) return false;
  if (isBound(opensMinutesBefore) && now < startTime - opensMinutesBefore * MINUTE) return false;
  if (isBound(closesMinutesAfter) && now > startTime + closesMinutesAfter * MINUTE) return false;
  return true;
}
