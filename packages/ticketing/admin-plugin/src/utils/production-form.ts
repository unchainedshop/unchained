// Values of the production forms and the ticketing inputs built from them. Pure, so it runs in
// node --test. Prices are entered as decimals and sent in cents; dates are local datetime values.
// The admin-ui useForm turns blank top-level fields into null, so every text may be null.
import { fromDateTimeLocalValue, toDateTimeLocalValue } from './dates.ts';

export interface ShopDefaults {
  locale: string;
  currencyCode: string;
  countryCode: string;
}

type FormText = string | null | undefined;

export type OnSaleValue = 'inherit' | 'open' | 'closed';

export interface SaleRulesFormValues {
  onSale: OnSaleValue | null;
  salesStart: FormText;
  salesEnd: FormText;
  maxPerOrder: FormText;
}

export interface TicketSaleRules {
  onSale?: boolean | null;
  salesStart?: string | null;
  salesEnd?: string | null;
  maxPerOrder?: number | null;
}

const CATEGORY_CODE = /^[a-z0-9][a-z0-9_-]*$/;
const DECIMAL = /^\d+(\.\d{1,2})?$/;
const WHOLE = /^\d+$/;

const str = (value: unknown) => (value === null || value === undefined ? '' : String(value)).trim();

/** Cents of a decimal price; null when blank, NaN when it is not a price. */
export function toCents(value: FormText): number {
  const text = str(value);
  if (!text) return null;
  if (!DECIMAL.test(text)) return NaN;
  return Math.round(Number(text) * 100);
}

export const centsToDecimal = (amount: number | null | undefined) =>
  amount === null || amount === undefined ? '' : (amount / 100).toFixed(2);

/** A whole number of 0 or more; null when blank, NaN otherwise. */
export const toCount = (value: FormText): number => {
  const text = str(value);
  if (!text) return null;
  return WHOLE.test(text) ? Number(text) : NaN;
};

export const isCategoryCode = (value: FormText) => CATEGORY_CODE.test(str(value));

const isInvalid = (value: number) => Number.isNaN(value);

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));

export function fromTicketSaleRules(rules?: TicketSaleRules | null): SaleRulesFormValues {
  const onSale: OnSaleValue =
    rules?.onSale === true ? 'open' : rules?.onSale === false ? 'closed' : 'inherit';
  return {
    onSale,
    salesStart: toDateTimeLocalValue(rules?.salesStart),
    salesEnd: toDateTimeLocalValue(rules?.salesEnd),
    maxPerOrder: text(rules?.maxPerOrder),
  };
}

/** Every rule of the form: a blank rule or "inherit" clears it (null). */
export function toTicketSaleRulesInput(
  values: Partial<SaleRulesFormValues>,
): { input: Required<TicketSaleRules> } | { errors: string[] } {
  const errors: string[] = [];
  const date = (key: 'salesStart' | 'salesEnd') => {
    const parsed = fromDateTimeLocalValue(str(values[key]));
    if (parsed && Number.isNaN(parsed.getTime())) {
      errors.push(key);
      return null;
    }
    return parsed ? parsed.toISOString() : null;
  };
  const salesStart = date('salesStart');
  const salesEnd = date('salesEnd');
  const maxPerOrder = toCount(values.maxPerOrder);
  if (isInvalid(maxPerOrder)) errors.push('maxPerOrder');
  if (errors.length) return { errors };
  const onSale = values.onSale || 'inherit';
  return {
    input: {
      onSale: onSale === 'inherit' ? null : onSale === 'open',
      salesStart,
      salesEnd,
      maxPerOrder,
    },
  };
}

/** The createTicketProduction input of the new production form, or the invalid fields. */
export function toCreateTicketProductionInput(
  values: { title?: FormText; subtitle?: FormText; tags?: string[] | null; location?: FormText },
  { locale }: Pick<ShopDefaults, 'locale'>,
): { input: Record<string, any> } | { errors: string[] } {
  const title = str(values.title);
  if (!title) return { errors: ['title'] };
  const subtitle = str(values.subtitle);
  const location = str(values.location);
  return {
    input: {
      texts: [{ locale, title, ...(subtitle && { subtitle }) }],
      ...(values.tags?.length && { tags: values.tags }),
      ...(location && { location }),
    },
  };
}

export interface ProductionEventFormValues extends SaleRulesFormValues {
  location: FormText;
  durationMinutes: FormText;
  doorsOpenMinutesBefore: FormText;
}

export function productionEventFormValues(production: any): ProductionEventFormValues {
  const details = production?.ticketProduction;
  return {
    location: text(details?.location),
    durationMinutes: text(details?.durationMinutes),
    doorsOpenMinutesBefore: text(details?.doorsOpenMinutesBefore),
    ...fromTicketSaleRules(details?.saleRules),
  };
}

/** The updateTicketProduction input of the event form: every detail and rule, blanks clear them. */
export function toUpdateTicketProductionInput(
  values: Partial<ProductionEventFormValues>,
): { input: Record<string, any> } | { errors: string[] } {
  const errors: string[] = [];
  const durationMinutes = toCount(values.durationMinutes);
  if (isInvalid(durationMinutes)) errors.push('durationMinutes');
  const doorsOpenMinutesBefore = toCount(values.doorsOpenMinutesBefore);
  if (isInvalid(doorsOpenMinutesBefore)) errors.push('doorsOpenMinutesBefore');
  const saleRules = toTicketSaleRulesInput(values);
  if ('errors' in saleRules) errors.push(...saleRules.errors);
  if (errors.length || !('input' in saleRules)) return { errors };
  return {
    input: {
      location: str(values.location) || null,
      durationMinutes,
      doorsOpenMinutesBefore,
      saleRules: saleRules.input,
    },
  };
}

const withoutNull = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== null)) as Partial<T>;

export interface PerformanceEditFormValues {
  startsAt: string;
  /** Blank: taken over from the production. */
  location: string;
  durationMinutes: string;
  doorsOpenMinutesBefore: string;
  saleRules: SaleRulesFormValues;
  /** Supply and price per category code ('' without categories). */
  tickets: Record<string, { supply: string; price: string }>;
}

const PERFORMANCE_DETAILS = ['location', 'durationMinutes', 'doorsOpenMinutesBefore'] as const;

/** The form of a performance row (see buildPerformanceGrid), or of a new one without row. */
export function performanceFormValues(
  row: { startsAt: string; cells: Record<string, any>; products: any[] } | null,
  columns: (string | null)[],
): PerformanceEditFormValues {
  const productOf = (code: string | null) => (code ? row?.cells[code] : row?.products[0]);
  const first = productOf(columns[0]);
  const event = first?.event;
  const overridden: string[] = event?.overridden ?? [];
  const detail = (key: (typeof PERFORMANCE_DETAILS)[number]) =>
    overridden.includes(key) ? text(event?.[key]) : '';
  return {
    startsAt: toDateTimeLocalValue(row?.startsAt),
    location: detail('location'),
    durationMinutes: detail('durationMinutes'),
    doorsOpenMinutesBefore: detail('doorsOpenMinutesBefore'),
    saleRules: fromTicketSaleRules(event?.ownSaleRules),
    tickets: Object.fromEntries(
      columns.map((code) => {
        const product = productOf(code);
        return [
          code ?? '',
          {
            supply: text(product?.contractConfiguration?.supply),
            price: centsToDecimal(product?.catalogPrice?.amount),
          },
        ];
      }),
    ),
  };
}

/**
 * The input of addTicketPerformance (without initial values) or updateTicketPerformance: the
 * start when it is new or changed, the details and tickets that changed and all sale rules.
 */
export function toTicketPerformanceInput(
  values: PerformanceEditFormValues,
  initial: PerformanceEditFormValues | null,
  { currencyCode, countryCode }: Pick<ShopDefaults, 'currencyCode' | 'countryCode'>,
): { input: Record<string, any> } | { errors: string[] } {
  const errors: string[] = [];
  const input: Record<string, any> = {};
  const startsAt = fromDateTimeLocalValue(str(values.startsAt));
  if (!startsAt || Number.isNaN(startsAt.getTime())) errors.push('startsAt');
  else if (!initial || values.startsAt !== initial.startsAt) input.startsAt = startsAt.toISOString();

  for (const key of PERFORMANCE_DETAILS) {
    if (initial && values[key] === initial[key]) continue;
    if (key === 'location') {
      if (str(values.location) || initial) input.location = str(values.location) || null;
      continue;
    }
    const value = toCount(values[key]);
    if (isInvalid(value)) errors.push(key);
    else if (value !== null || initial) input[key] = value;
  }

  const saleRules = toTicketSaleRulesInput(values.saleRules);
  if ('errors' in saleRules) errors.push(...saleRules.errors);
  else input.saleRules = saleRules.input;

  const tickets = Object.entries(values.tickets).flatMap(([code, ticket]) => {
    const before = initial?.tickets[code];
    const supply = toCount(ticket.supply);
    const amount = toCents(ticket.price);
    if (isInvalid(supply)) errors.push(`tickets.${code}.supply`);
    if (isInvalid(amount)) errors.push(`tickets.${code}.price`);
    const changed = withoutNull({
      supply: ticket.supply !== (before?.supply ?? '') ? supply : null,
      pricing:
        ticket.price !== (before?.price ?? '') && amount !== null
          ? [{ amount, currencyCode, countryCode }]
          : null,
    });
    return Object.keys(changed).length ? [{ ...(code && { category: code }), ...changed }] : [];
  });
  if (tickets.length) input.tickets = tickets;
  if (errors.length) return { errors };
  return { input };
}
