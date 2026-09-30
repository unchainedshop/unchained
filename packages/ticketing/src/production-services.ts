import type { Bound, UnchainedCore } from '@unchainedshop/core';
import {
  ProductStatus,
  ProductType,
  type Product,
  type ProductAssignment,
  type ProductPrice,
  type ProductText,
} from '@unchainedshop/core-products';
import type { TicketingModule } from './module.ts';
import { registerEvents, subscribe, type RawPayloadType } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import { TicketEventProperty } from './event-details.ts';
import { TICKET_PRODUCTION_TAG, isTicketProduction } from './production.ts';
import { normalizeTicketSaleRulesInput, type UpdateTicketSaleRulesInput } from './sale-rules.ts';

type Modules = UnchainedCore['modules'];
type TicketingModules = Modules & TicketingModule;

const SLOT = TicketEventProperty.START;
const CATEGORY = TicketEventProperty.CATEGORY;

/** Details of a production that its performances take over unless they override them. */
export const TICKET_PRODUCTION_DETAILS = [
  TicketEventProperty.LOCATION,
  TicketEventProperty.DURATION_MINUTES,
  TicketEventProperty.DOORS_OPEN_MINUTES_BEFORE,
] as const;

type TicketProductionDetail = (typeof TICKET_PRODUCTION_DETAILS)[number];

const CATEGORY_CODE = /^[a-z0-9][a-z0-9_-]*$/;

export interface TicketPriceInput {
  amount: number;
  currencyCode: string;
  countryCode: string;
  isTaxable?: boolean | null;
  isNetPrice?: boolean | null;
}

export interface TicketCategoryInput {
  /** Also the value of the `category` variation option and the key in `meta.ticketCategories`. */
  code: string;
  /** The category name per locale (variation option texts). */
  texts?: { locale: string; title?: string | null }[] | null;
  /** The supply of the category in a new performance. */
  capacity?: number | null;
  /** The price of the category in a new performance. */
  pricing?: TicketPriceInput[] | null;
}

/** The tickets of one category in one performance; unset values come from the category. */
export interface TicketPerformanceTicketInput {
  category?: string | null;
  supply?: number | null;
  pricing?: TicketPriceInput[] | null;
}

export interface TicketDetailsInput {
  location?: string | null;
  durationMinutes?: number | null;
  doorsOpenMinutesBefore?: number | null;
}

export interface TicketPerformanceInput extends TicketDetailsInput {
  startsAt?: Date | string | null;
  saleRules?: UpdateTicketSaleRulesInput | null;
  tickets?: TicketPerformanceTicketInput[] | null;
}

export interface TicketProductionTextInput {
  locale: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  slug?: string | null;
}

export interface CreateTicketProductionInput extends TicketDetailsInput {
  texts: TicketProductionTextInput[];
  tags?: string[] | null;
  saleRules?: UpdateTicketSaleRulesInput | null;
  categories?: TicketCategoryInput[] | null;
  performances?: (TicketPerformanceInput & { startsAt: Date | string })[] | null;
}

interface TicketCategoryDefaults {
  capacity?: number;
  pricing?: ProductPrice[];
}

const fail = (message: string, cause: string) => new Error(message, { cause });

const isPlainObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCount = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;

function toSlot(startsAt: unknown) {
  const date = startsAt instanceof Date ? startsAt : new Date(startsAt as string);
  if (startsAt === null || startsAt === undefined || Number.isNaN(date.getTime())) {
    throw fail(`Invalid performance start: ${startsAt}`, 'INVALID_TICKET_PERFORMANCE');
  }
  return { date, value: date.toISOString() };
}

// Slug suffix of a performance: its start in UTC, e.g. 20261101-1800
const slotStamp = (date: Date) => date.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');

/** The details of an input that are set (a value) or cleared (null), validated. */
function normalizeDetails(input: TicketDetailsInput | null | undefined, cause: string) {
  const details: Partial<Record<TicketProductionDetail, string | number | null>> = {};
  for (const key of TICKET_PRODUCTION_DETAILS) {
    const value = input?.[key];
    if (value === undefined) continue;
    if (value === null || (typeof value === 'string' && !value.trim())) {
      details[key] = null;
    } else if (key === TicketEventProperty.LOCATION) {
      if (typeof value !== 'string') throw fail(`Invalid ${key}`, cause);
      details[key] = value.trim();
    } else {
      if (!isCount(value)) throw fail(`Invalid ${key}: ${value}`, cause);
      details[key] = value as number;
    }
  }
  return details;
}

function normalizeSaleRules(input?: UpdateTicketSaleRulesInput | null) {
  const saleRules = normalizeTicketSaleRulesInput(input);
  if (!saleRules) throw fail('Invalid sale rules', 'INVALID_TICKET_SALE_RULES');
  return saleRules;
}

function normalizePricing(pricing?: TicketPriceInput[] | null): ProductPrice[] | undefined {
  if (pricing === undefined || pricing === null) return undefined;
  return pricing.map(({ amount, currencyCode, countryCode, isTaxable, isNetPrice }) => {
    if (!Number.isInteger(amount) || !currencyCode || !countryCode) {
      throw fail('Invalid ticket price', 'INVALID_TICKET_PRICE');
    }
    return {
      amount,
      currencyCode,
      countryCode,
      ...(isTaxable !== undefined && isTaxable !== null && { isTaxable }),
      ...(isNetPrice !== undefined && isNetPrice !== null && { isNetPrice }),
    };
  });
}

function normalizeCategories(categories?: TicketCategoryInput[] | null) {
  const codes = new Set<string>();
  return (categories ?? []).map(({ code, texts, capacity, pricing }) => {
    if (typeof code !== 'string' || !CATEGORY_CODE.test(code) || codes.has(code)) {
      throw fail(`Invalid or repeated ticket category code: ${code}`, 'INVALID_TICKET_CATEGORY_CODE');
    }
    codes.add(code);
    if (capacity !== undefined && capacity !== null && !isCount(capacity)) {
      throw fail(`Invalid capacity of category ${code}`, 'INVALID_TICKET_CATEGORY');
    }
    const defaults: TicketCategoryDefaults = {
      ...(capacity !== undefined && capacity !== null && { capacity }),
      ...(pricing && { pricing: normalizePricing(pricing) }),
    };
    return { code, texts: texts ?? [], defaults };
  });
}

function normalizeTickets(
  tickets: TicketPerformanceTicketInput[] | null | undefined,
  categoryCodes: (string | null)[],
) {
  return (tickets ?? []).map(({ category = null, supply, pricing }) => {
    const code = category || null;
    if (!categoryCodes.includes(code)) {
      throw fail(`Unknown ticket category: ${code}`, 'TICKET_CATEGORY_NOT_FOUND');
    }
    if (supply !== undefined && supply !== null && !isCount(supply)) {
      throw fail(`Invalid supply: ${supply}`, 'INVALID_TICKET_PERFORMANCE');
    }
    return {
      category: code,
      ...(supply !== undefined && supply !== null && { supply }),
      ...(pricing && { pricing: normalizePricing(pricing) }),
    };
  });
}

// The dotted $set of one level of meta; nested objects that are missing are created by MongoDB.
const toMetaModifier = (changes: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(changes).map(([key, value]) => [`meta.${key}`, value]));

export async function findTicketProduction(modules: Modules, productionId: string) {
  const production = await modules.products.findProduct({ productId: productionId });
  if (!isTicketProduction(production) || production!.status === ProductStatus.DELETED) {
    throw fail(`Ticket production ${productionId} not found`, 'TICKET_PRODUCTION_NOT_FOUND');
  }
  return production as Product;
}

/** The category codes of a production in the order of its `category` variation, [] without. */
export async function findTicketCategoryCodes(modules: Modules, productionId: string) {
  const variation = await modules.products.variations.findProductVariationByKey({
    productId: productionId,
    key: CATEGORY,
  });
  return variation?.options ?? [];
}

/** The performance products of one start, with their assignment. */
export async function findTicketPerformance(modules: Modules, production: Product, slot: string) {
  const assignments = (production.proxy?.assignments ?? []).filter(
    ({ vector }) => vector?.[SLOT] === slot,
  );
  if (!assignments.length) {
    throw fail(`Performance ${slot} not found`, 'TICKET_PERFORMANCE_NOT_FOUND');
  }
  return Promise.all(
    assignments.map(async (assignment) => ({
      assignment,
      product: (await modules.products.findProduct({ productId: assignment.productId })) as Product,
    })),
  );
}

const childTags = (production: Product) =>
  (production.tags ?? []).filter((tag) => tag !== TICKET_PRODUCTION_TAG);

const childSlug = (productionText: ProductText, date: Date, code: string | null) =>
  [productionText.slug || productionText.title || 'performance', slotStamp(date), code]
    .filter(Boolean)
    .join('-');

// Texts of a performance: the texts of its production with the slug of the performance.
async function writeChildTexts(
  modules: Modules,
  productId: string,
  productionTexts: ProductText[],
  { date, code, slugs = true }: { date: Date; code: string | null; slugs?: boolean },
) {
  if (!productionTexts.length) return;
  await modules.products.texts.updateTexts(
    productId,
    productionTexts.map((text) => ({
      locale: text.locale,
      title: text.title,
      ...(text.subtitle !== undefined && { subtitle: text.subtitle }),
      ...(text.description !== undefined && { description: text.description }),
      ...(slugs && { slug: childSlug(text, date, code) }),
    })),
  );
}

/**
 * Media of a performance: rows that point to the files of the production media, in the same order.
 * Rows of production media that are gone are removed; only the rows, the files belong to the
 * production. Media added to the performance itself stay.
 */
async function syncProductionMedia(modules: Modules, productionId: string, productId: string) {
  const [medias, copies] = await Promise.all([
    modules.products.media.findProductMedias({ productId: productionId }),
    modules.products.media.findProductMedias({ productId }),
  ]);
  for (const media of medias) {
    const copy = copies.find(({ meta }) => meta?.productionMediaId === media._id);
    if (!copy) {
      await modules.products.media.create({
        productId,
        mediaId: media.mediaId,
        tags: media.tags ?? [],
        sortKey: media.sortKey,
        meta: { productionMediaId: media._id },
      });
    } else if (copy.sortKey !== media.sortKey) {
      await modules.products.media.update(copy._id, { sortKey: media.sortKey });
    }
  }
  for (const copy of copies) {
    const productionMediaId = copy.meta?.productionMediaId;
    if (productionMediaId && !medias.some(({ _id }) => _id === productionMediaId)) {
      await modules.products.media.delete(copy._id);
    }
  }
}

// Issued tickets (also cancelled ones) and tickets of pending orders keep a product alive.
async function hasTickets(modules: Modules, productId: string) {
  const { passes } = modules as TicketingModules;
  const [issued, reserved] = await Promise.all([
    modules.warehousing.tokensCount({ productId }),
    passes.countReservedTickets({ productId }),
  ]);
  return issued > 0 || reserved > 0;
}

async function findPerformanceProducts(modules: Modules, production: Product) {
  return Promise.all(
    (production.proxy?.assignments ?? []).map(async (assignment) => ({
      assignment,
      product: (await modules.products.findProduct({ productId: assignment.productId })) as Product,
    })),
  );
}

interface PerformancePlan {
  slot: { date: Date; value: string };
  details: Partial<Record<TicketProductionDetail, string | number | null>>;
  saleRules: Record<string, unknown>;
  tickets: ReturnType<typeof normalizeTickets>;
}

function planPerformance(input: TicketPerformanceInput, categoryCodes: (string | null)[]) {
  return {
    slot: toSlot(input.startsAt),
    details: normalizeDetails(input, 'INVALID_TICKET_PERFORMANCE'),
    saleRules: normalizeSaleRules(input.saleRules),
    tickets: normalizeTickets(input.tickets, categoryCodes),
  } satisfies PerformancePlan;
}

// Creates the products of one performance: one per category, or one without categories.
async function createPerformanceProducts(
  modules: Modules,
  production: Product,
  plan: PerformancePlan,
  categoryCodes: string[],
) {
  const productionTexts = await modules.products.texts.findTexts({ productId: production._id });
  const categories: Record<string, TicketCategoryDefaults> = production.meta?.ticketCategories ?? {};
  const inherited = Object.fromEntries(
    TICKET_PRODUCTION_DETAILS.filter(
      (key) => production.meta?.[key] !== undefined && production.meta?.[key] !== null,
    ).map((key) => [key, production.meta![key]]),
  );
  const overridden = Object.keys(plan.details).filter((key) => plan.details[key] !== null);
  const details = {
    ...inherited,
    ...Object.fromEntries(Object.entries(plan.details).filter(([, value]) => value !== null)),
  };
  const saleRules = Object.fromEntries(
    Object.entries(plan.saleRules).filter(([, value]) => value !== null),
  );

  const created: Product[] = [];
  for (const code of categoryCodes.length ? categoryCodes : [null]) {
    const ticket = plan.tickets.find(({ category }) => category === code);
    const defaults = code ? categories[code] : undefined;
    const supply = ticket?.supply ?? defaults?.capacity;
    const pricing = ticket?.pricing ?? defaults?.pricing;
    const product = await modules.products.create({
      type: ProductType.TOKENIZED_PRODUCT,
      tags: childTags(production),
      sequence: production.sequence,
      tokenization: {
        contractStandard: 'ERC721',
        ...(supply !== undefined && { supply }),
      } as Product['tokenization'],
      ...(pricing && { commerce: { pricing } }),
      meta: {
        [SLOT]: plan.slot.date,
        ...(code && { [CATEGORY]: code }),
        ...details,
        ...(overridden.length && { overridden }),
        ...(Object.keys(saleRules).length && { saleRules }),
      },
    });
    const vectors = [
      { key: SLOT, value: plan.slot.value },
      ...(code ? [{ key: CATEGORY, value: code }] : []),
    ];
    const assigned = await modules.products.assignments.addProxyAssignment({
      proxyId: production._id,
      productId: product._id,
      vectors,
    });
    if (!assigned) {
      await modules.products.delete(product._id);
      await modules.products.deleteProductPermanently({ productId: product._id });
      throw fail(`Performance ${plan.slot.value} exists`, 'TICKET_PERFORMANCE_EXISTS');
    }
    await writeChildTexts(modules, product._id, productionTexts, { date: plan.slot.date, code });
    await syncProductionMedia(modules, production._id, product._id);
    if (production.status === ProductStatus.ACTIVE) await modules.products.publish(product);
    created.push(product);
  }
  return created;
}

async function createTicketProduction(this: Modules, input: CreateTicketProductionInput) {
  const categories = normalizeCategories(input.categories);
  const categoryCodes = categories.map(({ code }) => code);
  const details = normalizeDetails(input, 'INVALID_TICKET_PRODUCTION');
  const saleRules = normalizeSaleRules(input.saleRules);
  const plans = (input.performances ?? []).map((performance) =>
    planPerformance(performance, categoryCodes.length ? categoryCodes : [null]),
  );
  const slots = plans.map(({ slot }) => slot.value);
  if (new Set(slots).size !== slots.length) {
    throw fail('A performance start is given twice', 'TICKET_PERFORMANCE_EXISTS');
  }

  const setSaleRules = Object.fromEntries(
    Object.entries(saleRules).filter(([, value]) => value !== null),
  );
  const production = await this.products.create({
    type: ProductType.CONFIGURABLE_PRODUCT,
    tags: [TICKET_PRODUCTION_TAG, ...(input.tags ?? []).filter((tag) => tag !== TICKET_PRODUCTION_TAG)],
    meta: {
      ...Object.fromEntries(Object.entries(details).filter(([, value]) => value !== null)),
      ...(Object.keys(setSaleRules).length && { saleRules: setSaleRules }),
      ...(categories.length && {
        ticketCategories: Object.fromEntries(categories.map(({ code, defaults }) => [code, defaults])),
      }),
    },
  });
  if (input.texts?.length) {
    await this.products.texts.updateTexts(
      production._id,
      input.texts.map(({ locale, ...text }) => ({
        locale,
        ...Object.fromEntries(Object.entries(text).filter(([, value]) => value !== null)),
      })),
    );
  }
  await this.products.variations.create({
    productId: production._id,
    key: SLOT,
    type: 'TEXT',
    options: slots,
  });
  if (categories.length) {
    const variation = await this.products.variations.create({
      productId: production._id,
      key: CATEGORY,
      type: 'TEXT',
      options: categoryCodes,
    });
    for (const { code, texts } of categories) {
      if (texts.length) {
        await this.products.variations.texts.updateVariationTexts(
          variation._id,
          texts.map(({ locale, title }) => ({ locale, title: title ?? undefined })),
          code,
        );
      }
    }
  }

  const stored = (await this.products.findProduct({ productId: production._id })) as Product;
  for (const plan of plans) {
    await createPerformanceProducts(this, stored, plan, categoryCodes);
  }
  return (await this.products.findProduct({ productId: production._id })) as Product;
}

async function addTicketPerformance(this: Modules, productionId: string, input: TicketPerformanceInput) {
  const production = await findTicketProduction(this, productionId);
  const categoryCodes = await findTicketCategoryCodes(this, productionId);
  const plan = planPerformance(input, categoryCodes.length ? categoryCodes : [null]);
  const slotVariation = await this.products.variations.findProductVariationByKey({
    productId: productionId,
    key: SLOT,
  });
  if (
    slotVariation?.options?.includes(plan.slot.value) ||
    (production.proxy?.assignments ?? []).some(({ vector }) => vector?.[SLOT] === plan.slot.value)
  ) {
    throw fail(`Performance ${plan.slot.value} exists`, 'TICKET_PERFORMANCE_EXISTS');
  }
  if (slotVariation) {
    await this.products.variations.addVariationOption(slotVariation._id, { value: plan.slot.value });
  } else {
    await this.products.variations.create({
      productId: productionId,
      key: SLOT,
      type: 'TEXT',
      options: [plan.slot.value],
    });
  }
  await createPerformanceProducts(this, production, plan, categoryCodes);
  return (await this.products.findProduct({ productId: productionId })) as Product;
}

async function updateTicketPerformance(
  this: Modules,
  productionId: string,
  slot: string,
  input: TicketPerformanceInput,
) {
  const { passes } = this as TicketingModules;
  const production = await findTicketProduction(this, productionId);
  const performance = await findTicketPerformance(this, production, slot);
  const categoryCodes = await findTicketCategoryCodes(this, productionId);
  const details = normalizeDetails(input, 'INVALID_TICKET_PERFORMANCE');
  const saleRules = normalizeSaleRules(input.saleRules);
  const tickets = normalizeTickets(input.tickets, categoryCodes.length ? categoryCodes : [null]);
  const reschedule =
    input.startsAt !== undefined && input.startsAt !== null ? toSlot(input.startsAt) : null;
  const slotVariation = await this.products.variations.findProductVariationByKey({
    productId: productionId,
    key: SLOT,
  });

  // Everything is checked before the first write
  if (reschedule && reschedule.value !== slot) {
    if (
      slotVariation?.options?.includes(reschedule.value) ||
      (production.proxy?.assignments ?? []).some(({ vector }) => vector?.[SLOT] === reschedule.value)
    ) {
      throw fail(`Performance ${reschedule.value} exists`, 'TICKET_PERFORMANCE_EXISTS');
    }
  }
  const ticketsByProduct = tickets.map((ticket) => {
    const match = performance.find(
      ({ assignment }) => (assignment.vector?.[CATEGORY] ?? null) === ticket.category,
    );
    if (!match) throw fail(`Unknown ticket category: ${ticket.category}`, 'TICKET_CATEGORY_NOT_FOUND');
    return { ticket, product: match.product };
  });
  for (const { ticket, product } of ticketsByProduct) {
    if (ticket.supply === undefined || ticket.supply === 0) continue;
    const gone = await passes.countReservedTickets({ productId: product._id });
    if (gone > ticket.supply) {
      throw fail(
        `Supply ${ticket.supply} is below the ${gone} tickets that are gone`,
        'TICKET_SUPPLY_BELOW_SOLD',
      );
    }
  }

  for (const { product } of performance) {
    const changes: Record<string, unknown> = {};
    const overridden = new Set<string>(
      Array.isArray(product.meta?.overridden) ? product.meta.overridden : [],
    );
    for (const [key, value] of Object.entries(details)) {
      if (value === null) {
        overridden.delete(key);
        changes[key] = production.meta?.[key] ?? null;
      } else {
        overridden.add(key);
        changes[key] = value;
      }
    }
    if (Object.keys(details).length) changes.overridden = [...overridden];
    const meta = isPlainObject(product.meta) ? product.meta : {};
    if (Object.keys(saleRules).length) {
      if (isPlainObject(meta.saleRules)) {
        for (const [rule, value] of Object.entries(saleRules)) changes[`saleRules.${rule}`] = value;
      } else {
        changes.saleRules = Object.fromEntries(
          Object.entries(saleRules).filter(([, value]) => value !== null),
        );
      }
    }
    if (reschedule) changes[SLOT] = reschedule.date;
    if (!Object.keys(changes).length) continue;
    await this.products.update(
      product._id,
      isPlainObject(product.meta) ? toMetaModifier(changes) : { meta: changes },
    );
  }

  for (const { ticket, product } of ticketsByProduct) {
    await this.products.update(product._id, {
      ...(ticket.supply !== undefined && {
        tokenization: { ...product.tokenization, supply: ticket.supply },
      }),
      ...(ticket.pricing && { commerce: { ...product.commerce, pricing: ticket.pricing } }),
    });
  }

  if (reschedule && reschedule.value !== slot) {
    if (slotVariation) {
      await this.products.variations.addVariationOption(slotVariation._id, {
        value: reschedule.value,
      });
    }
    const assignments = (production.proxy?.assignments ?? []).map((assignment: ProductAssignment) =>
      assignment.vector?.[SLOT] === slot
        ? { ...assignment, vector: { ...assignment.vector, [SLOT]: reschedule.value } }
        : assignment,
    );
    await this.products.update(productionId, { 'proxy.assignments': assignments });
    const productionTexts = await this.products.texts.findTexts({ productId: productionId });
    for (const { assignment, product } of performance) {
      const code = assignment.vector?.[CATEGORY] ?? null;
      const texts = await this.products.texts.findTexts({ productId: product._id });
      await this.products.texts.updateTexts(
        product._id,
        productionTexts.map((productionText) => ({
          locale: productionText.locale,
          title: texts.find(({ locale }) => locale === productionText.locale)?.title,
          slug: childSlug(productionText, reschedule.date, code),
        })),
      );
    }
    if (slotVariation) await this.products.variations.removeVariationOption(slotVariation._id, slot);
  }
  return (await this.products.findProduct({ productId: productionId })) as Product;
}

/**
 * Removes a performance without tickets from its production and returns the ids of its products,
 * which the caller removes (services.products.removeProduct).
 */
async function removeTicketPerformance(this: Modules, productionId: string, slot: string) {
  const { passes } = this as TicketingModules;
  const production = await findTicketProduction(this, productionId);
  const performance = await findTicketPerformance(this, production, slot);
  for (const { product } of performance) {
    const [issued, reserved] = await Promise.all([
      this.warehousing.tokensCount({ productId: product._id }),
      passes.countReservedTickets({ productId: product._id }),
    ]);
    if (issued > 0 || reserved > 0) {
      throw fail(`Performance ${slot} has tickets, cancel it instead`, 'TICKET_PERFORMANCE_HAS_TICKETS');
    }
  }
  for (const { assignment } of performance) {
    await this.products.assignments.removeAssignment(productionId, {
      vectors: Object.entries(assignment.vector ?? {}).map(([key, value]) => ({ key, value })),
    });
  }
  const slotVariation = await this.products.variations.findProductVariationByKey({
    productId: productionId,
    key: SLOT,
  });
  if (slotVariation) await this.products.variations.removeVariationOption(slotVariation._id, slot);
  return performance.map(({ product }) => product._id);
}

async function setTicketProductionStatus(this: Modules, productionId: string, publish: boolean) {
  const production = await findTicketProduction(this, productionId);
  const change = (product: Product) =>
    publish ? this.products.publish(product) : this.products.unpublish(product);
  for (const { productId } of production.proxy?.assignments ?? []) {
    const product = await this.products.findProduct({ productId });
    if (product) await change(product);
  }
  await change(production);
  return (await this.products.findProduct({ productId: productionId })) as Product;
}

/** Publishes a production with all its performances. */
async function publishTicketProduction(this: Modules, productionId: string) {
  return setTicketProductionStatus.call(this, productionId, true);
}

/** Takes a production and all its performances back to draft. */
async function unpublishTicketProduction(this: Modules, productionId: string) {
  return setTicketProductionStatus.call(this, productionId, false);
}

export interface UpdateTicketProductionInput extends TicketDetailsInput {
  texts?: TicketProductionTextInput[] | null;
  tags?: string[] | null;
  saleRules?: UpdateTicketSaleRulesInput | null;
}

// Sets rules key by key where possible; a missing or broken saleRules object is replaced.
function saleRulesChanges(
  meta: Record<string, any> | null | undefined,
  saleRules: Record<string, unknown>,
) {
  if (!Object.keys(saleRules).length) return {};
  if (isPlainObject(meta?.saleRules)) {
    return Object.fromEntries(
      Object.entries(saleRules).map(([rule, value]) => [`saleRules.${rule}`, value]),
    );
  }
  return {
    saleRules: Object.fromEntries(Object.entries(saleRules).filter(([, value]) => value !== null)),
  };
}

// Takes the texts, tags, details that are not overridden, status and media of a production over.
async function syncPerformance(
  modules: Modules,
  production: Product,
  product: Product,
  { details, texts }: { details: Record<string, unknown>; texts: ProductText[] },
) {
  const overridden: string[] = Array.isArray(product.meta?.overridden) ? product.meta.overridden : [];
  const inherited = Object.fromEntries(
    Object.entries(details).filter(([key]) => !overridden.includes(key)),
  );
  const meta = isPlainObject(product.meta) ? product.meta : null;
  await modules.products.update(product._id, {
    tags: childTags(production),
    ...(Object.keys(inherited).length &&
      (meta ? toMetaModifier(inherited) : { meta: { ...inherited } })),
  });
  if (texts.length) {
    const date = product.meta?.[SLOT] instanceof Date ? product.meta[SLOT] : new Date();
    await writeChildTexts(modules, product._id, texts, { date, code: null, slugs: false });
  }
  await syncProductionMedia(modules, production._id, product._id);
  const updated = (await modules.products.findProduct({ productId: product._id })) as Product;
  if (production.status === ProductStatus.ACTIVE) await modules.products.publish(updated);
  else await modules.products.unpublish(updated);
}

const productionDetails = (production: Product) =>
  Object.fromEntries(
    TICKET_PRODUCTION_DETAILS.map((key) => [key, production.meta?.[key] ?? null]),
  ) as Record<string, unknown>;

/**
 * Changes the texts, tags, details and sale rules of a production. Texts (without the slugs),
 * tags and the details a performance does not override are taken over by the performances;
 * sale rules are inherited when a ticket is sold.
 */
async function updateTicketProduction(
  this: Modules,
  productionId: string,
  input: UpdateTicketProductionInput,
) {
  const production = await findTicketProduction(this, productionId);
  const details = normalizeDetails(input, 'INVALID_TICKET_PRODUCTION');
  const saleRules = normalizeSaleRules(input.saleRules);

  const meta = isPlainObject(production.meta) ? production.meta : {};
  const metaChanges = { ...details, ...saleRulesChanges(meta, saleRules) };
  await this.products.update(productionId, {
    ...(input.tags && {
      tags: [TICKET_PRODUCTION_TAG, ...input.tags.filter((tag) => tag !== TICKET_PRODUCTION_TAG)],
    }),
    ...(Object.keys(metaChanges).length &&
      (isPlainObject(production.meta) ? toMetaModifier(metaChanges) : { meta: metaChanges })),
  });
  if (input.texts?.length) {
    await this.products.texts.updateTexts(
      productionId,
      input.texts.map(({ locale, slug, ...text }) => ({
        locale,
        ...text,
        ...(slug && { slug }),
      })) as any,
    );
  }

  const updated = await findTicketProduction(this, productionId);
  const texts = input.texts?.length
    ? await this.products.texts.findTexts({ productId: productionId })
    : [];
  for (const { product } of await findPerformanceProducts(this, updated)) {
    if (!product) continue;
    await syncPerformance(this, updated, product, { details, texts });
  }
  return updated;
}

/**
 * Takes texts, tags, details, status and media of a production over to all its performances
 * again, e.g. after the production was changed in the core product tabs or imported.
 */
async function syncTicketProduction(this: Modules, productionId: string) {
  const production = await findTicketProduction(this, productionId);
  const texts = await this.products.texts.findTexts({ productId: productionId });
  const details = productionDetails(production);
  for (const { product } of await findPerformanceProducts(this, production)) {
    if (!product) continue;
    await syncPerformance(this, production, product, { details, texts });
  }
  return production;
}

/** Removes the rows that shared a removed production media with the performances. */
async function removeTicketProductionMediaCopies(this: Modules, productMediaId: string) {
  const productions = await this.products.findProducts({
    type: ProductType.CONFIGURABLE_PRODUCT,
    tags: [TICKET_PRODUCTION_TAG],
    includeDrafts: true,
  });
  const productIds = productions.flatMap((production) =>
    (production.proxy?.assignments ?? []).map(({ productId }) => productId),
  );
  if (!productIds.length) return 0;
  const copies = (await this.products.media.findProductMedias({ productIds })).filter(
    ({ meta }) => meta?.productionMediaId === productMediaId,
  );
  for (const copy of copies) await this.products.media.delete(copy._id);
  return copies.length;
}

async function addTicketCategory(this: Modules, productionId: string, input: TicketCategoryInput) {
  const production = await findTicketProduction(this, productionId);
  const [category] = normalizeCategories([input]);
  const codes = await findTicketCategoryCodes(this, productionId);
  if (codes.includes(category.code)) {
    throw fail(`Ticket category ${category.code} exists`, 'TICKET_CATEGORY_EXISTS');
  }
  await this.products.update(productionId, {
    [`meta.ticketCategories.${category.code}`]: category.defaults,
  });

  let variation = await this.products.variations.findProductVariationByKey({
    productId: productionId,
    key: CATEGORY,
  });
  const performances = await findPerformanceProducts(this, production);
  if (!variation) {
    // The first category takes over the performances that exist, with their tickets
    variation = await this.products.variations.create({
      productId: productionId,
      key: CATEGORY,
      type: 'TEXT',
      options: [category.code],
    });
    const assignments = (production.proxy?.assignments ?? []).map((assignment) => ({
      ...assignment,
      vector: { ...assignment.vector, [CATEGORY]: category.code },
    }));
    await this.products.update(productionId, { 'proxy.assignments': assignments });
    for (const { product } of performances) {
      if (product) await this.products.update(product._id, { [`meta.${CATEGORY}`]: category.code });
    }
  } else {
    await this.products.variations.addVariationOption(variation._id, { value: category.code });
    const updated = await findTicketProduction(this, productionId);
    const slots = [...new Set(performances.map(({ assignment }) => assignment.vector?.[SLOT]))];
    for (const slot of slots) {
      // The new tickets take the details and sale rules of the performance over
      const sibling = performances.find(({ assignment }) => assignment.vector?.[SLOT] === slot)!;
      const overridden: string[] = sibling.product?.meta?.overridden ?? [];
      await createPerformanceProducts(
        this,
        updated,
        {
          slot: toSlot(slot),
          details: Object.fromEntries(overridden.map((key) => [key, sibling.product.meta?.[key]])),
          saleRules: sibling.product?.meta?.saleRules ?? {},
          tickets: [],
        },
        [category.code],
      );
    }
  }
  if (category.texts.length) {
    await this.products.variations.texts.updateVariationTexts(
      variation._id,
      category.texts.map(({ locale, title }) => ({ locale, title: title ?? undefined })),
      category.code,
    );
  }
  return findTicketProduction(this, productionId);
}

async function updateTicketCategory(
  this: Modules,
  productionId: string,
  code: string,
  input: Omit<TicketCategoryInput, 'code'>,
  { applyToPerformances = false }: { applyToPerformances?: boolean } = {},
) {
  const { passes } = this as TicketingModules;
  const production = await findTicketProduction(this, productionId);
  const codes = await findTicketCategoryCodes(this, productionId);
  if (!codes.includes(code)) throw fail(`Unknown ticket category: ${code}`, 'TICKET_CATEGORY_NOT_FOUND');
  const [{ texts, defaults }] = normalizeCategories([{ ...input, code }]);
  const stored: TicketCategoryDefaults = production.meta?.ticketCategories?.[code] ?? {};
  const effective = { ...stored, ...defaults };
  if (input.capacity === null) delete effective.capacity;

  const performances = (await findPerformanceProducts(this, production)).filter(
    ({ assignment }) => assignment.vector?.[CATEGORY] === code,
  );
  if (applyToPerformances && effective.capacity) {
    for (const { product } of performances) {
      const gone = await passes.countReservedTickets({ productId: product._id });
      if (gone > effective.capacity) {
        throw fail(
          `Supply ${effective.capacity} is below the ${gone} tickets that are gone`,
          'TICKET_SUPPLY_BELOW_SOLD',
        );
      }
    }
  }
  await this.products.update(productionId, { [`meta.ticketCategories.${code}`]: effective });
  if (texts.length) {
    const variation = await this.products.variations.findProductVariationByKey({
      productId: productionId,
      key: CATEGORY,
    });
    await this.products.variations.texts.updateVariationTexts(
      variation!._id,
      texts.map(({ locale, title }) => ({ locale, title: title ?? undefined })),
      code,
    );
  }
  if (applyToPerformances) {
    for (const { product } of performances) {
      await this.products.update(product._id, {
        tokenization: {
          ...product.tokenization,
          ...(effective.capacity !== undefined && { supply: effective.capacity }),
        },
        ...(effective.pricing && { commerce: { ...product.commerce, pricing: effective.pricing } }),
      });
    }
  }
  return findTicketProduction(this, productionId);
}

/**
 * Removes a category without tickets and returns the ids of its performance products, which the
 * caller removes (services.products.removeProduct). The last category cannot be removed.
 */
async function removeTicketCategory(this: Modules, productionId: string, code: string) {
  const production = await findTicketProduction(this, productionId);
  const codes = await findTicketCategoryCodes(this, productionId);
  if (!codes.includes(code)) throw fail(`Unknown ticket category: ${code}`, 'TICKET_CATEGORY_NOT_FOUND');
  if (codes.length === 1) {
    throw fail('The last ticket category cannot be removed', 'INVALID_TICKET_CATEGORY');
  }
  const performances = (await findPerformanceProducts(this, production)).filter(
    ({ assignment }) => assignment.vector?.[CATEGORY] === code,
  );
  for (const { product } of performances) {
    if (await hasTickets(this, product._id)) {
      throw fail(`Ticket category ${code} has tickets`, 'TICKET_CATEGORY_HAS_TICKETS');
    }
  }
  for (const { assignment } of performances) {
    await this.products.assignments.removeAssignment(productionId, {
      vectors: Object.entries(assignment.vector ?? {}).map(([key, value]) => ({ key, value })),
    });
  }
  const variation = await this.products.variations.findProductVariationByKey({
    productId: productionId,
    key: CATEGORY,
  });
  await this.products.variations.removeVariationOption(variation!._id, code);
  const ticketCategories = Object.fromEntries(
    Object.entries(production.meta?.ticketCategories ?? {}).filter(([key]) => key !== code),
  );
  await this.products.update(productionId, { 'meta.ticketCategories': ticketCategories });
  return performances.map(({ product }) => product._id);
}

/**
 * Checks that no performance of a production has tickets and returns the ids of the performance
 * products and of the production, in the order the caller removes them
 * (services.products.removeProduct).
 */
async function removeTicketProduction(this: Modules, productionId: string) {
  const production = await findTicketProduction(this, productionId);
  const performances = await findPerformanceProducts(this, production);
  for (const { product } of performances) {
    if (product && (await hasTickets(this, product._id))) {
      throw fail('The production has tickets, cancel it instead', 'TICKET_PERFORMANCE_HAS_TICKETS');
    }
  }
  return [...performances.map(({ product }) => product?._id).filter(Boolean), productionId] as string[];
}

/** Shares the media of a production with all its performances again. */
async function syncTicketProductionMedia(this: Modules, productionId: string) {
  const production = await findTicketProduction(this, productionId);
  for (const { productId } of production.proxy?.assignments ?? []) {
    await syncProductionMedia(this, productionId, productId);
  }
}

const logger = createLogger('unchained:ticketing');

/** Takes the texts of a production over to its performances (not their slugs). */
async function syncTicketProductionTexts(this: Modules, productionId: string) {
  const production = await findTicketProduction(this, productionId);
  const texts = await this.products.texts.findTexts({ productId: productionId });
  for (const { productId } of production.proxy?.assignments ?? []) {
    await writeChildTexts(this, productId, texts, { date: new Date(), code: null, slugs: false });
  }
}

/** Takes the tags of a production over to its performances. */
async function syncTicketProductionTags(this: Modules, productionId: string) {
  const production = await findTicketProduction(this, productionId);
  for (const { productId } of production.proxy?.assignments ?? []) {
    await this.products.update(productId, { tags: childTags(production) });
  }
}

/**
 * Keeps the performances in step with their production when its media, texts or tags change,
 * also through the core product tabs (media, texts, tags).
 */
export function subscribeTicketProductionSync({ modules }: { modules: Modules }) {
  // The products module may register its events after the plugins
  registerEvents([
    'PRODUCT_ADD_MEDIA',
    'PRODUCT_REORDER_MEDIA',
    'PRODUCT_REMOVE_MEDIA',
    'PRODUCT_UPDATE_TEXT',
    'PRODUCT_UPDATE',
  ]);
  const run = (task: () => Promise<unknown>) => task().catch((error) => logger.error(error));
  // One sync per production at a time, so media added together are not copied twice
  const queues = new Map<string, Promise<unknown>>();
  const enqueue = (
    productId: string | undefined,
    syncProduction: (this: Modules, productionId: string) => Promise<unknown>,
  ) => {
    if (!productId) return Promise.resolve();
    const next = (queues.get(productId) ?? Promise.resolve()).then(() =>
      run(async () => {
        const product = await modules.products.findProduct({ productId });
        if (isTicketProduction(product)) await syncProduction.call(modules, productId);
      }),
    );
    queues.set(productId, next);
    return next.finally(() => {
      if (queues.get(productId) === next) queues.delete(productId);
    });
  };

  subscribe(
    'PRODUCT_ADD_MEDIA',
    ({ payload }: RawPayloadType<{ productMedia?: { productId?: string } }>) =>
      enqueue(payload?.productMedia?.productId, syncTicketProductionMedia),
  );
  subscribe(
    'PRODUCT_REORDER_MEDIA',
    ({ payload }: RawPayloadType<{ productMedias?: { productId?: string }[] }>) =>
      enqueue(payload?.productMedias?.[0]?.productId, syncTicketProductionMedia),
  );
  subscribe('PRODUCT_UPDATE_TEXT', ({ payload }: RawPayloadType<{ productId?: string }>) =>
    enqueue(payload?.productId, syncTicketProductionTexts),
  );
  // Only changed tags matter; the other product updates do not reach the performances
  subscribe('PRODUCT_UPDATE', ({ payload }: RawPayloadType<{ productId?: string; tags?: string[] }>) =>
    payload?.tags ? enqueue(payload.productId, syncTicketProductionTags) : undefined,
  );
  subscribe('PRODUCT_REMOVE_MEDIA', ({ payload }: RawPayloadType<{ productMediaId?: string }>) =>
    run(async () => {
      if (payload?.productMediaId) {
        await removeTicketProductionMediaCopies.call(modules, payload.productMediaId);
      }
    }),
  );
}

export default {
  ticketing: {
    syncTicketProductionMedia,
    createTicketProduction,
    updateTicketProduction,
    syncTicketProduction,
    removeTicketProduction,
    removeTicketProductionMediaCopies,
    addTicketPerformance,
    updateTicketPerformance,
    removeTicketPerformance,
    publishTicketProduction,
    unpublishTicketProduction,
    addTicketCategory,
    updateTicketCategory,
    removeTicketCategory,
  },
};

export interface TicketProductionServices {
  ticketing: {
    createTicketProduction: Bound<typeof createTicketProduction>;
    updateTicketProduction: Bound<typeof updateTicketProduction>;
    syncTicketProduction: Bound<typeof syncTicketProduction>;
    removeTicketProduction: Bound<typeof removeTicketProduction>;
    removeTicketProductionMediaCopies: Bound<typeof removeTicketProductionMediaCopies>;
    addTicketPerformance: Bound<typeof addTicketPerformance>;
    updateTicketPerformance: Bound<typeof updateTicketPerformance>;
    removeTicketPerformance: Bound<typeof removeTicketPerformance>;
    publishTicketProduction: Bound<typeof publishTicketProduction>;
    unpublishTicketProduction: Bound<typeof unpublishTicketProduction>;
    addTicketCategory: Bound<typeof addTicketCategory>;
    updateTicketCategory: Bound<typeof updateTicketCategory>;
    removeTicketCategory: Bound<typeof removeTicketCategory>;
    syncTicketProductionMedia: Bound<typeof syncTicketProductionMedia>;
  };
}
