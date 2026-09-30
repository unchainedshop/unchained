import type { Product } from '@unchainedshop/core-products';
import { getTicketEventDetails, isTicketEventCancelled } from '../../../event-details.ts';

const toDate = (value: unknown) => {
  if (!(value instanceof Date) && typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// getTicketEventDetails only returns valid dates, which the DateTime scalar can serialize.
export const TokenizedProduct = {
  event(product: Product) {
    const details = getTicketEventDetails(product);
    const isCanceled = isTicketEventCancelled(product);
    return {
      startsAt: details.startsAt ?? null,
      endsAt: details.endsAt ?? null,
      doorsOpenAt: details.doorsOpenAt ?? null,
      location: details.location ?? null,
      durationMinutes: details.durationMinutes ?? null,
      doorsOpenMinutesBefore: details.doorsOpenMinutesBefore ?? null,
      category: details.category ?? null,
      isCanceled,
      cancelledDate: isCanceled ? toDate(product.meta?.cancelledDate) : null,
    };
  },
};
