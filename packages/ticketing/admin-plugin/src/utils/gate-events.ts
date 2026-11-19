// Which events a gate admits and how the gate names them. Pure, so it runs in node --test.

export interface GateEvent {
  _id: string;
  event?: {
    startsAt?: string | null;
    location?: string | null;
    category?: string | null;
    categoryTitle?: string | null;
    productionId?: string | null;
  } | null;
  texts?: { title?: string | null } | null;
}

/** The gate's events from the URL (?event=a,b), so a gate device survives a reload. */
export function parseGateEventIds(value: string | string[] | undefined | null): string[] {
  const values = Array.isArray(value) ? value : [value];
  const ids = values.flatMap((text) => (text || '').split(',').map((id) => id.trim()));
  return [...new Set(ids.filter(Boolean))];
}

export const formatGateEventIds = (eventIds: string[]) => eventIds.join(',');

const performanceKey = ({ event, texts }: GateEvent) => {
  if (!event?.startsAt) return null;
  if (event.productionId) return JSON.stringify([event.productionId, event.startsAt]);
  return JSON.stringify([texts?.title || '', event.startsAt, event.location || '']);
};

/**
 * The events sold for the same performance as event: the categories of the same date of its
 * production, or for standalone events those with the same title, start and location (one product
 * per seating area). Includes event itself; an event without a start stands alone.
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
    startsAt: distinct(events.map((event) => event.event?.startsAt)),
    locations: distinct(events.map((event) => event.event?.location)),
    categories: distinct(events.map((event) => event.event?.categoryTitle || event.event?.category)),
  };
}
