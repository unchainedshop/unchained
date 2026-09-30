import type { Product } from '@unchainedshop/core-products';
import { getTicketEventDetails, isTicketEventCancelled } from '../../../event-details.ts';

// getTicketEventDetails only returns valid dates, which the DateTime scalar can serialize.
export const TokenizedProduct = {
  isCanceled(product: Product): boolean {
    return isTicketEventCancelled(product);
  },
  eventStartsAt(product: Product): Date | null {
    return getTicketEventDetails(product).startsAt ?? null;
  },
  eventEndsAt(product: Product): Date | null {
    return getTicketEventDetails(product).endsAt ?? null;
  },
  eventDoorsOpenAt(product: Product): Date | null {
    return getTicketEventDetails(product).doorsOpenAt ?? null;
  },
  eventLocation(product: Product): string | null {
    return getTicketEventDetails(product).location ?? null;
  },
  eventCategory(product: Product): string | null {
    return getTicketEventDetails(product).category ?? null;
  },
  eventDurationMinutes(product: Product): number | null {
    return getTicketEventDetails(product).durationMinutes ?? null;
  },
  eventDoorsOpenMinutesBefore(product: Product): number | null {
    return getTicketEventDetails(product).doorsOpenMinutesBefore ?? null;
  },
};
