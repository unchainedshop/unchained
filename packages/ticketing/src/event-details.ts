import type { Product } from '@unchainedshop/core-products';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';

/** Keys of the event facts in `product.meta`, next to the `cancelled` flag of the event. */
export const TicketEventProperty = {
  START: 'slot',
  LOCATION: 'location',
  DURATION_MINUTES: 'durationMinutes',
  DOORS_OPEN_MINUTES_BEFORE: 'doorsOpenMinutesBefore',
  CATEGORY: 'category',
} as const;

export type TicketEventProperty = (typeof TicketEventProperty)[keyof typeof TicketEventProperty];

export interface TicketEventDetails {
  startsAt?: Date;
  /** startsAt + durationMinutes */
  endsAt?: Date;
  /** startsAt - doorsOpenMinutesBefore */
  doorsOpenAt?: Date;
  location?: string;
  durationMinutes?: number;
  doorsOpenMinutesBefore?: number;
  category?: string;
}

const MINUTE = 60_000;

const isPresent = (value: unknown) => value !== undefined && value !== null && value !== '';

const readProperty = (product: Product, key: TicketEventProperty) => product.meta?.[key];

const toNumber = (value: unknown) => {
  if (!isPresent(value) || typeof value === 'boolean') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const toText = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined);

/**
 * The stored event start as a Date, or undefined when none is set. An unparsable value is returned
 * as an invalid Date so the entry window can refuse entry instead of treating the event as dateless.
 */
export function getTicketEventStart(product?: Product | null): Date | undefined {
  if (!product) return undefined;
  const value = readProperty(product, TicketEventProperty.START);
  if (!isPresent(value)) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(NaN);
}

/**
 * The event facts of a ticket product from its meta. Missing or unparsable values are left out.
 */
export function getTicketEventDetails(product?: Product | null): TicketEventDetails {
  if (!product) return {};
  const start = getTicketEventStart(product);
  const startsAt = start && !Number.isNaN(start.getTime()) ? start : undefined;
  const durationMinutes = toNumber(readProperty(product, TicketEventProperty.DURATION_MINUTES));
  const doorsOpenMinutesBefore = toNumber(
    readProperty(product, TicketEventProperty.DOORS_OPEN_MINUTES_BEFORE),
  );

  const details: TicketEventDetails = {
    startsAt,
    endsAt:
      startsAt && durationMinutes !== undefined
        ? new Date(startsAt.getTime() + durationMinutes * MINUTE)
        : undefined,
    doorsOpenAt:
      startsAt && doorsOpenMinutesBefore !== undefined
        ? new Date(startsAt.getTime() - doorsOpenMinutesBefore * MINUTE)
        : undefined,
    location: toText(readProperty(product, TicketEventProperty.LOCATION)),
    durationMinutes,
    doorsOpenMinutesBefore,
    category: toText(readProperty(product, TicketEventProperty.CATEGORY)),
  };
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as TicketEventDetails;
}

/**
 * An event is cancelled through cancelEvent; the product itself stays active. The flag lives in
 * `product.meta` with the event details, so a bulk import that sends `specification.meta` replaces
 * them all and un-cancels the event.
 */
export function isTicketEventCancelled(product?: Product | null): boolean {
  return Boolean(product?.meta?.cancelled);
}

/** A cancelled ticket also carries an invalidatedDate, so check this before treating it as redeemed. */
export function isTicketCancelled(token?: TokenSurrogate | null): boolean {
  return Boolean(token?.meta?.cancelled);
}
