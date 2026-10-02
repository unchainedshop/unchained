// Box office sales: performances to sell, the cart items with attendee names, sale errors. Pure.
import { findSamePerformance, type GateEvent } from './gate-events.ts';

export const BOX_OFFICE_PAYMENT_ADAPTER_KEY = 'shop.unchained.payment.box-office';

/** The order position configuration the ticket issuer reads the attendee names from. */
export const ATTENDEES_CONFIGURATION_KEY = 'attendees';

/**
 * The events for sale grouped by performance (same title, start and location), in the order of
 * events: one entry per performance with its ticket products, typically one per category.
 */
export function groupPerformances<T extends GateEvent>(events: T[]): T[][] {
  const seen = new Set<string>();
  const performances: T[][] = [];
  for (const event of events) {
    if (seen.has(event._id)) continue;
    const performance = findSamePerformance(events, event) as T[];
    performance.forEach(({ _id }) => seen.add(_id));
    performances.push(performance);
  }
  return performances;
}

/**
 * The attendees configuration value, one name per seat. Commas separate the seats, so they are
 * taken out of the names; seats without a name stay empty. Null without any name.
 */
export function attendeesValue(names: (string | null | undefined)[], quantity: number) {
  const seats = Array.from({ length: quantity }, (_, index) =>
    (names[index] || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim(),
  );
  return seats.some(Boolean) ? seats.join(', ') : null;
}

/** The cart items of a sale: the products with a quantity, with the attendee names if any. */
export function buildBoxOfficeItems(
  quantities: Record<string, number>,
  attendees: Record<string, (string | null | undefined)[]> = {},
) {
  return Object.entries(quantities)
    .filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0)
    .map(([productId, quantity]) => {
      const value = attendeesValue(attendees[productId] || [], quantity);
      return {
        productId,
        quantity,
        ...(value && { configuration: [{ key: ATTENDEES_CONFIGURATION_KEY, value }] }),
      };
    });
}

/** The box office payment provider among the providers a cart supports. */
export const findBoxOfficeProvider = (
  providers: { _id: string; interface?: { _id?: string | null } | null }[] = [],
) => providers.find((provider) => provider.interface?._id === BOX_OFFICE_PAYMENT_ADAPTER_KEY) || null;

/**
 * The ticket sale error code of a failed cart mutation (TicketSoldOutError, …): cart mutations
 * answer it in extensions.code, checkoutCart in extensions.detailCode.
 */
export function saleErrorCode(error: unknown): string | null {
  const e = error as {
    errors?: { extensions?: { code?: string; detailCode?: string } }[];
    graphQLErrors?: { extensions?: { code?: string; detailCode?: string } }[];
  };
  for (const { extensions } of e?.errors ?? e?.graphQLErrors ?? []) {
    const code = extensions?.detailCode || extensions?.code;
    if (code?.startsWith('Ticket')) return code;
  }
  return null;
}
