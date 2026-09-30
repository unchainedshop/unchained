import type { Context } from '@unchainedshop/api';
import { InvalidIdError, ProductNotFoundError, ProductWrongTypeError } from '@unchainedshop/api';
import { ProductType } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import { assertTicketEventInScope } from '../../roles.ts';
import { TicketEventProperty } from '../../../event-details.ts';

export interface UpdateTicketEventInput {
  startsAt?: Date | string | null;
  location?: string | null;
  durationMinutes?: number | null;
  doorsOpenMinutesBefore?: number | null;
  category?: string | null;
}

const EVENT_PROPERTIES: [keyof UpdateTicketEventInput, TicketEventProperty][] = [
  ['startsAt', TicketEventProperty.START],
  ['location', TicketEventProperty.LOCATION],
  ['durationMinutes', TicketEventProperty.DURATION_MINUTES],
  ['doorsOpenMinutesBefore', TicketEventProperty.DOORS_OPEN_MINUTES_BEFORE],
  ['category', TicketEventProperty.CATEGORY],
];

// null or blank text clears a detail; the start is stored as a date so ranges and sorting work.
const normalize = (field: keyof UpdateTicketEventInput, value: unknown) => {
  if (value === null) return null;
  if (typeof value === 'string') {
    if (!value.trim()) return null;
    return field === 'startsAt' ? new Date(value) : value.trim();
  }
  return value;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Sets the given event details in `product.meta` key by key; omitted details and the other meta
 * fields stay as they are.
 */
export default async function updateTicketEvent(
  _root: never,
  { productId, event }: { productId: string; event: UpdateTicketEventInput },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation updateTicketEvent ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  if (product.type !== ProductType.TOKENIZED_PRODUCT) {
    throw new ProductWrongTypeError({
      productId,
      received: product.type,
      required: ProductType.TOKENIZED_PRODUCT,
    });
  }
  await assertTicketEventInScope(product, context, 'manageProducts');

  const changes = Object.fromEntries(
    EVENT_PROPERTIES.filter(([field]) => event?.[field] !== undefined).map(([field, key]) => [
      key,
      normalize(field, event[field]),
    ]),
  );
  if (!Object.keys(changes).length) return product;

  // A meta that is not an object cannot take dotted keys, so it is replaced as a whole.
  const modifier = isPlainObject(product.meta)
    ? Object.fromEntries(Object.entries(changes).map(([key, value]) => [`meta.${key}`, value]))
    : {
        meta: Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== null)),
      };
  await modules.products.update(productId, modifier);
  return modules.products.findProduct({ productId });
}
