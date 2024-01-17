export * as calculation from './calculation.js';

export * from './locale-helpers.js';
export { default as objectInvert } from './object-invert.js';
export { default as findUnusedSlug } from './find-unused-slug.js';
export { default as slugify } from './slugify.js';
export { default as pipePromises } from './pipe-promises.js';
export { default as generateRandomHash } from './generate-random-hash.js';
export { default as randomValueHex } from './random-value-hex.js';
export { default as buildObfuscatedFieldsFilter } from './build-obfuscated-fields-filter.js';

/*
 * Schemas
 */

export { Schemas } from './schemas/index.js';

/*
 * Director
 */

export { BaseAdapter } from './director/BaseAdapter.js';
export { BaseDirector } from './director/BaseDirector.js';
export { BasePricingAdapter } from './director/BasePricingAdapter.js';
export { BasePricingDirector } from './director/BasePricingDirector.js';
export { BasePricingSheet } from './director/BasePricingSheet.js';
export { BaseDiscountAdapter } from './director/BaseDiscountAdapter.js';
export { BaseDiscountDirector } from './director/BaseDiscountDirector.js';

/*

function resolveBestCountry(
  contextCountry: string,
  headerCountry: string | string[],
  countries: Array<Country>,
): string;
function resolveUserRemoteAddress(req: IncomingMessage): {
  remoteAddress: string;
  remotePort: string;
};

function objectInvert(obj: Record<string, string>): Record<string, string>;

const systemLocale: Locale;

const Schemas: {
  timestampFields: TimestampFields;
  User: SimpleSchema;
  Address: SimpleSchema;
  Contact: SimpleSchema;
};

// Director
const BaseAdapter: IBaseAdapter;
const BaseDirector: <Adapter extends IBaseAdapter>(
  directorName: string,
  options?: {
    adapterSortKey?: string;
    adapterKeyField?: string;
  },
) => IBaseDirector<Adapter>;

const BaseDiscountAdapter: Omit<IDiscountAdapter, 'key' | 'label' | 'version'>;
const BaseDiscountDirector: (directorName: string) => IDiscountDirector;

const BasePricingAdapter: <
  AdapterContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
>() => IPricingAdapter<AdapterContext, Calculation, IPricingSheet<Calculation>>;

const BasePricingDirector: <
  PricingContext extends BasePricingContext,
  AdapterPricingContext extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
  Adapter extends IPricingAdapter<AdapterPricingContext, Calculation, IPricingSheet<Calculation>>,
>(
  directorName: string,
) => IPricingDirector<
  PricingContext,
  Calculation,
  AdapterPricingContext,
  IPricingSheet<Calculation>,
  Adapter
>;

const BasePricingSheet: <Calculation extends PricingCalculation>(
  params: PricingSheetParams<Calculation>,
) => IBasePricingSheet<Calculation>;

*/
