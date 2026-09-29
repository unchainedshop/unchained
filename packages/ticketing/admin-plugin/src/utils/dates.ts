// Date ranges and inputs of the ticketing pages, in the browser's time zone. Pure, so they run
// in node --test.

/** Where the ticket event start lives; ticketEvents sorts by it (sort alias of the event date). */
export const EVENT_START_SORT_KEY = 'tokenization.ercMetadataProperties.slot';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * The events a gate picks from: everything starting today, plus events that started after 18:00
 * yesterday (a late show still admits people after midnight). The range only changes once a day,
 * so polling keeps the same query variables.
 */
export function getGateSlotRange(now: Date) {
  const today = startOfDay(now);
  return {
    slotFrom: new Date(today.getFullYear(), today.getMonth(), today.getDate(), -6).toISOString(),
    slotTo: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    ).toISOString(),
  };
}

export type EventListPeriod = 'upcoming' | 'past' | 'all';

export const EVENT_LIST_PERIODS: EventListPeriod[] = ['upcoming', 'past', 'all'];

/**
 * Upcoming events (from today on) come soonest first, past events and all events latest first.
 * Events without a start date only appear under "all". _id breaks ties so pages do not overlap.
 */
export function getEventListFilter(period: string | undefined, now: Date) {
  const today = startOfDay(now);
  if (period === 'past') {
    return {
      slotTo: new Date(today.getTime() - 1).toISOString(),
      sort: [
        { key: EVENT_START_SORT_KEY, value: 'DESC' },
        { key: '_id', value: 'DESC' },
      ],
    };
  }
  if (period === 'all') {
    return {
      sort: [
        { key: EVENT_START_SORT_KEY, value: 'DESC' },
        { key: '_id', value: 'DESC' },
      ],
    };
  }
  return {
    slotFrom: today.toISOString(),
    sort: [
      { key: EVENT_START_SORT_KEY, value: 'ASC' },
      { key: '_id', value: 'ASC' },
    ],
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Value for an <input type="datetime-local">, in local time; '' for no or an invalid date. */
export function toDateTimeLocalValue(value: string | Date | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Reads an <input type="datetime-local"> value as local time; null when blank. */
export function fromDateTimeLocalValue(value: string) {
  const text = value?.trim();
  if (!text) return null;
  // Date-time strings without an offset are local time; an unparsable one gives an Invalid Date.
  return new Date(text);
}
