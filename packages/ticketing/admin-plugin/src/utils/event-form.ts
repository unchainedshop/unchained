// Values of the event editor and the updateTicketEvent input built from them.
import { fromDateTimeLocalValue, toDateTimeLocalValue } from './dates.ts';

export interface TicketEventFormValues {
  startsAt: string;
  location: string;
  category: string;
  durationMinutes: string;
  doorsOpenMinutesBefore: string;
}

export interface UpdateTicketEventInput {
  startsAt: string | null;
  location: string | null;
  category: string | null;
  durationMinutes: number | null;
  doorsOpenMinutesBefore: number | null;
}

interface TicketEventProduct {
  event?: {
    startsAt?: string | null;
    location?: string | null;
    category?: string | null;
    durationMinutes?: number | null;
    doorsOpenMinutesBefore?: number | null;
  } | null;
}

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));

export function getTicketEventFormValues(product: TicketEventProduct): TicketEventFormValues {
  return {
    startsAt: toDateTimeLocalValue(product?.event?.startsAt),
    location: text(product?.event?.location),
    category: text(product?.event?.category),
    durationMinutes: text(product?.event?.durationMinutes),
    doorsOpenMinutesBefore: text(product?.event?.doorsOpenMinutesBefore),
  };
}

const MINUTES = /^\d+$/;

/**
 * The editor shows every detail, so it sends every detail: a blank field clears it (null).
 * Returns the names of the fields that are not valid instead of an input.
 */
export function toUpdateTicketEventInput(
  values: TicketEventFormValues,
): { input: UpdateTicketEventInput } | { errors: (keyof TicketEventFormValues)[] } {
  const errors: (keyof TicketEventFormValues)[] = [];
  const startsAt = fromDateTimeLocalValue(values.startsAt);
  if (startsAt && Number.isNaN(startsAt.getTime())) errors.push('startsAt');
  const minutes = (key: 'durationMinutes' | 'doorsOpenMinutesBefore') => {
    const value = values[key].trim();
    if (!value) return null;
    if (!MINUTES.test(value)) {
      errors.push(key);
      return null;
    }
    return Number(value);
  };
  const durationMinutes = minutes('durationMinutes');
  const doorsOpenMinutesBefore = minutes('doorsOpenMinutesBefore');
  if (errors.length) return { errors };
  return {
    input: {
      startsAt: startsAt ? startsAt.toISOString() : null,
      location: values.location.trim() || null,
      category: values.category.trim() || null,
      durationMinutes,
      doorsOpenMinutesBefore,
    },
  };
}
