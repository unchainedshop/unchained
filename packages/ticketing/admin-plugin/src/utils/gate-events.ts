// Which events a gate admits and how the gate names them. Pure, so it runs in node --test.

export interface GateEvent {
  _id: string;
  eventStartsAt?: string | null;
  eventLocation?: string | null;
  eventCategory?: string | null;
  texts?: { title?: string | null } | null;
}

/** The gate's events from the URL (?event=a,b), so a gate device survives a reload. */
export function parseGateEventIds(value: string | string[] | undefined | null): string[] {
  const values = Array.isArray(value) ? value : [value];
  const ids = values.flatMap((text) => (text || '').split(',').map((id) => id.trim()));
  return [...new Set(ids.filter(Boolean))];
}

export const formatGateEventIds = (eventIds: string[]) => eventIds.join(',');

const performanceKey = (event: GateEvent) =>
  event.eventStartsAt
    ? JSON.stringify([event.texts?.title || '', event.eventStartsAt, event.eventLocation || ''])
    : null;

/**
 * The events sold for the same performance as event: same title, start and location, typically
 * one product per ticket category or seating area. Includes event itself; an event without a
 * start stands alone.
 */
export function findSamePerformance<T extends GateEvent>(events: T[], event: T): T[] {
  const key = performanceKey(event);
  if (!key) return [event];
  return events.filter((other) => other._id === event._id || performanceKey(other) === key);
}

const distinct = (values: (string | null | undefined)[]) => [...new Set(values.filter(Boolean))];

/** What a gate heading shows: the distinct titles, starts, locations and categories, in order. */
export function summarizeGateEvents(events: GateEvent[]) {
  return {
    titles: distinct(events.map((event) => event.texts?.title)),
    startsAt: distinct(events.map((event) => event.eventStartsAt)),
    locations: distinct(events.map((event) => event.eventLocation)),
    categories: distinct(events.map((event) => event.eventCategory)),
  };
}
