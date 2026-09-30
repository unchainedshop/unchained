// Values of the production forms and the ticketing inputs built from them. Pure, so it runs in
// node --test. Prices are entered as decimals and sent in cents; dates are local datetime values.
import { fromDateTimeLocalValue, toDateTimeLocalValue } from './dates.ts';

export interface ShopDefaults {
  locale: string;
  currencyCode: string;
  countryCode: string;
}

export type OnSaleValue = 'inherit' | 'open' | 'closed';

export interface SaleRulesFormValues {
  onSale: OnSaleValue;
  salesStart: string;
  salesEnd: string;
  maxPerOrder: string;
}

export interface CategoryFormValues {
  code: string;
  name: string;
  capacity: string;
  price: string;
}

export interface PerformanceFormValues {
  startsAt: string;
  /** Only used without categories: the supply and price of the date. */
  supply: string;
  price: string;
}

export interface ProductionFormValues {
  title: string;
  subtitle: string;
  tags: string;
  location: string;
  durationMinutes: string;
  doorsOpenMinutesBefore: string;
  saleRules: SaleRulesFormValues;
  categories: CategoryFormValues[];
  performances: PerformanceFormValues[];
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

/** Cents of a decimal price; null when blank, NaN when it is not a price. */
export function toCents(value: string): number {
  const text = value?.trim();
  if (!text) return null;
  if (!DECIMAL.test(text)) return NaN;
  return Math.round(Number(text) * 100);
}

export const centsToDecimal = (amount: number | null | undefined) =>
  amount === null || amount === undefined ? '' : (amount / 100).toFixed(2);

const count = (value: string) => {
  const text = value?.trim();
  if (!text) return null;
  return WHOLE.test(text) ? Number(text) : NaN;
};

const isInvalid = (value: number) => Number.isNaN(value);

export const emptySaleRules = (): SaleRulesFormValues => ({
  onSale: 'inherit',
  salesStart: '',
  salesEnd: '',
  maxPerOrder: '',
});

export const emptyProductionFormValues = (): ProductionFormValues => ({
  title: '',
  subtitle: '',
  tags: '',
  location: '',
  durationMinutes: '',
  doorsOpenMinutesBefore: '',
  saleRules: emptySaleRules(),
  categories: [],
  performances: [{ startsAt: '', supply: '', price: '' }],
});

export function fromTicketSaleRules(rules?: TicketSaleRules | null): SaleRulesFormValues {
  const onSale: OnSaleValue =
    rules?.onSale === true ? 'open' : rules?.onSale === false ? 'closed' : 'inherit';
  return {
    onSale,
    salesStart: toDateTimeLocalValue(rules?.salesStart),
    salesEnd: toDateTimeLocalValue(rules?.salesEnd),
    maxPerOrder:
      rules?.maxPerOrder === null || rules?.maxPerOrder === undefined ? '' : String(rules.maxPerOrder),
  };
}

/** Every rule of the form: a blank rule or "inherit" clears it (null). */
export function toTicketSaleRulesInput(
  values: SaleRulesFormValues,
): { input: Required<TicketSaleRules> } | { errors: string[] } {
  const errors: string[] = [];
  const date = (key: 'salesStart' | 'salesEnd') => {
    const parsed = fromDateTimeLocalValue(values[key]);
    if (parsed && Number.isNaN(parsed.getTime())) {
      errors.push(`saleRules.${key}`);
      return null;
    }
    return parsed ? parsed.toISOString() : null;
  };
  const salesStart = date('salesStart');
  const salesEnd = date('salesEnd');
  const maxPerOrder = count(values.maxPerOrder);
  if (isInvalid(maxPerOrder)) errors.push('saleRules.maxPerOrder');
  if (errors.length) return { errors };
  return {
    input: {
      onSale: values.onSale === 'inherit' ? null : values.onSale === 'open',
      salesStart,
      salesEnd,
      maxPerOrder,
    },
  };
}

const withoutNull = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== null)) as Partial<T>;

const tagsOf = (value: string) => [
  ...new Set(
    value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
  ),
];

/** The createTicketProduction input of the new production form, or the invalid fields. */
export function toCreateTicketProductionInput(
  values: ProductionFormValues,
  { locale, currencyCode, countryCode }: ShopDefaults,
): { input: Record<string, any> } | { errors: string[] } {
  const errors: string[] = [];
  const title = values.title.trim();
  if (!title) errors.push('title');
  const durationMinutes = count(values.durationMinutes);
  if (isInvalid(durationMinutes)) errors.push('durationMinutes');
  const doorsOpenMinutesBefore = count(values.doorsOpenMinutesBefore);
  if (isInvalid(doorsOpenMinutesBefore)) errors.push('doorsOpenMinutesBefore');
  const saleRules = toTicketSaleRulesInput(values.saleRules);
  if ('errors' in saleRules) errors.push(...saleRules.errors);
  const pricing = (amount: number) =>
    amount === null ? undefined : [{ amount, currencyCode, countryCode }];

  const codes = new Set<string>();
  const categories = values.categories.map((category, index) => {
    const code = category.code.trim();
    if (!CATEGORY_CODE.test(code) || codes.has(code)) errors.push(`categories.${index}.code`);
    codes.add(code);
    const capacity = count(category.capacity);
    if (isInvalid(capacity)) errors.push(`categories.${index}.capacity`);
    const amount = toCents(category.price);
    if (isInvalid(amount)) errors.push(`categories.${index}.price`);
    return withoutNull({
      code,
      texts: category.name.trim() ? [{ locale, title: category.name.trim() }] : null,
      capacity,
      pricing: pricing(amount) ?? null,
    });
  });

  const performances = values.performances.map((performance, index) => {
    const startsAt = fromDateTimeLocalValue(performance.startsAt);
    if (!startsAt || Number.isNaN(startsAt.getTime())) errors.push(`performances.${index}.startsAt`);
    if (categories.length) return { startsAt: startsAt?.toISOString() };
    const supply = count(performance.supply);
    if (isInvalid(supply)) errors.push(`performances.${index}.supply`);
    const amount = toCents(performance.price);
    if (isInvalid(amount)) errors.push(`performances.${index}.price`);
    const ticket = withoutNull({ supply, pricing: pricing(amount) ?? null });
    return {
      startsAt: startsAt?.toISOString(),
      ...(Object.keys(ticket).length && { tickets: [ticket] }),
    };
  });

  if (errors.length) return { errors };
  return {
    input: {
      texts: [withoutNull({ locale, title, subtitle: values.subtitle.trim() || null })],
      ...(tagsOf(values.tags).length && { tags: tagsOf(values.tags) }),
      ...withoutNull({
        location: values.location.trim() || null,
        durationMinutes,
        doorsOpenMinutesBefore,
      }),
      saleRules: 'input' in saleRules ? withoutNull(saleRules.input) : {},
      ...(categories.length && { categories }),
      performances,
    },
  };
}

export interface ProductionEditFormValues {
  title: string;
  subtitle: string;
  description: string;
  tags: string;
  location: string;
  durationMinutes: string;
  doorsOpenMinutesBefore: string;
  saleRules: SaleRulesFormValues;
}

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));

export function productionEditFormValues(production: any): ProductionEditFormValues {
  const details = production?.ticketProduction;
  return {
    title: text(production?.texts?.title),
    subtitle: text(production?.texts?.subtitle),
    description: text(production?.texts?.description),
    tags: (production?.tags ?? []).filter((tag) => tag !== 'ticket-production').join(', '),
    location: text(details?.location),
    durationMinutes: text(details?.durationMinutes),
    doorsOpenMinutesBefore: text(details?.doorsOpenMinutesBefore),
    saleRules: fromTicketSaleRules(details?.saleRules),
  };
}

/** The updateTicketProduction input of the edit form: every field, a blank one clears it. */
export function toUpdateTicketProductionInput(
  values: ProductionEditFormValues,
  { locale }: Pick<ShopDefaults, 'locale'>,
): { input: Record<string, any> } | { errors: string[] } {
  const errors: string[] = [];
  const title = values.title.trim();
  if (!title) errors.push('title');
  const durationMinutes = count(values.durationMinutes);
  if (isInvalid(durationMinutes)) errors.push('durationMinutes');
  const doorsOpenMinutesBefore = count(values.doorsOpenMinutesBefore);
  if (isInvalid(doorsOpenMinutesBefore)) errors.push('doorsOpenMinutesBefore');
  const saleRules = toTicketSaleRulesInput(values.saleRules);
  if ('errors' in saleRules) errors.push(...saleRules.errors);
  if (errors.length || !('input' in saleRules)) return { errors };
  return {
    input: {
      texts: [
        {
          locale,
          title,
          subtitle: values.subtitle.trim() || null,
          description: values.description.trim() || null,
        },
      ],
      tags: tagsOf(values.tags),
      location: values.location.trim() || null,
      durationMinutes,
      doorsOpenMinutesBefore,
      saleRules: saleRules.input,
    },
  };
}

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
  const startsAt = fromDateTimeLocalValue(values.startsAt);
  if (!startsAt || Number.isNaN(startsAt.getTime())) errors.push('startsAt');
  else if (!initial || values.startsAt !== initial.startsAt) input.startsAt = startsAt.toISOString();

  for (const key of PERFORMANCE_DETAILS) {
    if (initial && values[key] === initial[key]) continue;
    if (key === 'location') {
      if (values.location.trim() || initial) input.location = values.location.trim() || null;
      continue;
    }
    const value = count(values[key]);
    if (isInvalid(value)) errors.push(key);
    else if (value !== null || initial) input[key] = value;
  }

  const saleRules = toTicketSaleRulesInput(values.saleRules);
  if ('errors' in saleRules) errors.push(...saleRules.errors);
  else input.saleRules = saleRules.input;

  const tickets = Object.entries(values.tickets).flatMap(([code, ticket]) => {
    const before = initial?.tickets[code];
    const supply = count(ticket.supply);
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
