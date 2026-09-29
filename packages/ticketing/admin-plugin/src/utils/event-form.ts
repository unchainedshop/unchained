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
  eventStartsAt?: string | null;
  eventLocation?: string | null;
  eventCategory?: string | null;
  contractConfiguration?: { ercMetadataProperties?: Record<string, unknown> | null } | null;
}

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));

export function getTicketEventFormValues(product: TicketEventProduct): TicketEventFormValues {
  const properties = product?.contractConfiguration?.ercMetadataProperties || {};
  return {
    startsAt: toDateTimeLocalValue(product?.eventStartsAt),
    location: text(product?.eventLocation),
    category: text(product?.eventCategory),
    durationMinutes: text(properties.durationMinutes),
    doorsOpenMinutesBefore: text(properties.doorsOpenMinutesBefore),
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
