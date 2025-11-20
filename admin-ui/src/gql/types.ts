export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTimeISO: { input: any; output: any; }
  JSON: { input: any; output: any; }
  Locale: { input: any; output: any; }
  LowerCaseString: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
};

export type IAddress = {
  addressLine?: Maybe<Scalars['String']['output']>;
  addressLine2?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  company?: Maybe<Scalars['String']['output']>;
  countryCode?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  postalCode?: Maybe<Scalars['String']['output']>;
  regionCode?: Maybe<Scalars['String']['output']>;
};

export type IAddressInput = {
  addressLine?: InputMaybe<Scalars['String']['input']>;
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  countryCode?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  regionCode?: InputMaybe<Scalars['String']['input']>;
};

export type IAdminUiConfig = {
  assortmentTags: Array<Scalars['String']['output']>;
  customProperties: Array<IAdminUiConfigCustomEntityInterface>;
  externalLinks: Array<IAdminUiLink>;
  productTags: Array<Scalars['String']['output']>;
  singleSignOnURL?: Maybe<Scalars['String']['output']>;
  userTags: Array<Scalars['String']['output']>;
};

export type IAdminUiConfigCustomEntityInterface = {
  entityName: Scalars['String']['output'];
  inlineFragment: Scalars['String']['output'];
};

export type IAdminUiLink = {
  href?: Maybe<Scalars['String']['output']>;
  target?: Maybe<IExternalLinkTarget>;
  title?: Maybe<Scalars['String']['output']>;
};

/** Assortment */
export type IAssortment = {
  _id: Scalars['ID']['output'];
  assortmentPaths: Array<IAssortmentPath>;
  children?: Maybe<Array<IAssortment>>;
  childrenCount: Scalars['Int']['output'];
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  filterAssignments?: Maybe<Array<IAssortmentFilter>>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  isBase?: Maybe<Scalars['Boolean']['output']>;
  isRoot?: Maybe<Scalars['Boolean']['output']>;
  linkedAssortments?: Maybe<Array<IAssortmentLink>>;
  media: Array<IAssortmentMedia>;
  productAssignments?: Maybe<Array<IAssortmentProduct>>;
  searchProducts: IProductSearchResult;
  sequence: Scalars['Int']['output'];
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IAssortmentTexts>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


/** Assortment */
export type IAssortmentChildrenArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Assortment */
export type IAssortmentChildrenCountArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Assortment */
export type IAssortmentMediaArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


/** Assortment */
export type IAssortmentSearchProductsArgs = {
  filterQuery?: InputMaybe<Array<IFilterQueryInput>>;
  ignoreChildAssortments?: InputMaybe<Scalars['Boolean']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  orderBy?: InputMaybe<ISearchOrderBy>;
  queryString?: InputMaybe<Scalars['String']['input']>;
};


/** Assortment */
export type IAssortmentTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IAssortmentFilter = {
  _id: Scalars['ID']['output'];
  assortment: IAssortment;
  filter: IFilter;
  sortKey: Scalars['Int']['output'];
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
};

export type IAssortmentLink = {
  _id: Scalars['ID']['output'];
  child: IAssortment;
  parent: IAssortment;
  sortKey: Scalars['Int']['output'];
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
};

export type IAssortmentMedia = {
  _id: Scalars['ID']['output'];
  file?: Maybe<IMedia>;
  sortKey: Scalars['Int']['output'];
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IAssortmentMediaTexts>;
};


export type IAssortmentMediaTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IAssortmentMediaTextInput = {
  locale: Scalars['Locale']['input'];
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type IAssortmentMediaTexts = {
  _id: Scalars['ID']['output'];
  locale: Scalars['Locale']['output'];
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

/** Directed assortment to product paths (breadcrumbs) */
export type IAssortmentPath = {
  links: Array<IAssortmentPathLink>;
};

/**
 * A connection that represents an uplink from assortment to assortment,
 * assortmentId and assortmentTexts are there for convenience
 * to short-circuit breadcrumb lookups
 */
export type IAssortmentPathLink = {
  assortmentId: Scalars['ID']['output'];
  assortmentTexts: IAssortmentTexts;
  link?: Maybe<IAssortmentLink>;
};


/**
 * A connection that represents an uplink from assortment to assortment,
 * assortmentId and assortmentTexts are there for convenience
 * to short-circuit breadcrumb lookups
 */
export type IAssortmentPathLinkAssortmentTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IAssortmentProduct = {
  _id: Scalars['ID']['output'];
  assortment: IAssortment;
  product: IProduct;
  sortKey: Scalars['Int']['output'];
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
};

export type IAssortmentSearchResult = {
  assortments: Array<IAssortment>;
  assortmentsCount: Scalars['Int']['output'];
};


export type IAssortmentSearchResultAssortmentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type IAssortmentTextInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  locale: Scalars['Locale']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type IAssortmentTexts = {
  _id: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  locale: Scalars['Locale']['output'];
  slug?: Maybe<Scalars['String']['output']>;
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type IBookmark = {
  _id: Scalars['ID']['output'];
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  product: IProduct;
  user: IUser;
};

/** A Bundle product consists of multiple products */
export type IBundleProduct = IProduct & {
  _id: Scalars['ID']['output'];
  assortmentPaths: Array<IProductAssortmentPath>;
  bundleItems?: Maybe<Array<IProductBundleItem>>;
  catalogPrice?: Maybe<IPrice>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  defaultOrderQuantity?: Maybe<Scalars['Int']['output']>;
  leveledCatalogPrices: Array<IPriceLevel>;
  media: Array<IProductMedia>;
  proxies: Array<IConfigurableOrBundleProduct>;
  published?: Maybe<Scalars['DateTimeISO']['output']>;
  reviews: Array<IProductReview>;
  reviewsCount: Scalars['Int']['output'];
  salesQuantityPerUnit?: Maybe<Scalars['String']['output']>;
  salesUnit?: Maybe<Scalars['String']['output']>;
  sequence: Scalars['Int']['output'];
  siblings: Array<IProduct>;
  simulatedPrice?: Maybe<IPrice>;
  status: IProductStatus;
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IProductTexts>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


/** A Bundle product consists of multiple products */
export type IBundleProductCatalogPriceArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
};


/** A Bundle product consists of multiple products */
export type IBundleProductLeveledCatalogPricesArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
};


/** A Bundle product consists of multiple products */
export type IBundleProductMediaArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


/** A Bundle product consists of multiple products */
export type IBundleProductReviewsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


/** A Bundle product consists of multiple products */
export type IBundleProductReviewsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


/** A Bundle product consists of multiple products */
export type IBundleProductSiblingsArgs = {
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** A Bundle product consists of multiple products */
export type IBundleProductSimulatedPriceArgs = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A Bundle product consists of multiple products */
export type IBundleProductTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export enum ICacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type IColor = {
  blue?: Maybe<Scalars['Int']['output']>;
  green?: Maybe<Scalars['Int']['output']>;
  hex?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  red?: Maybe<Scalars['Int']['output']>;
};

export type IConfigurableOrBundleProduct = IBundleProduct | IConfigurableProduct;

/** Configurable Product (Proxy) */
export type IConfigurableProduct = IProduct & {
  _id: Scalars['ID']['output'];
  /** Complete assignment matrix */
  assignments: Array<IProductVariationAssignment>;
  assortmentPaths: Array<IProductAssortmentPath>;
  catalogPriceRange?: Maybe<IPriceRange>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  media: Array<IProductMedia>;
  /** Reduced list of possible products by key/value combinations */
  products?: Maybe<Array<IProduct>>;
  proxies: Array<IConfigurableOrBundleProduct>;
  published?: Maybe<Scalars['DateTimeISO']['output']>;
  reviews: Array<IProductReview>;
  reviewsCount: Scalars['Int']['output'];
  sequence: Scalars['Int']['output'];
  siblings: Array<IProduct>;
  simulatedPriceRange?: Maybe<IPriceRange>;
  status: IProductStatus;
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IProductTexts>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
  /** Product's variations (keys) and their options (values) */
  variations?: Maybe<Array<IProductVariation>>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductAssignmentsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductCatalogPriceRangeArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  vectors?: InputMaybe<Array<IProductAssignmentVectorInput>>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductMediaArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductProductsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  vectors?: InputMaybe<Array<IProductAssignmentVectorInput>>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductReviewsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductReviewsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductSiblingsArgs = {
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductSimulatedPriceRangeArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
  vectors?: InputMaybe<Array<IProductAssignmentVectorInput>>;
};


/** Configurable Product (Proxy) */
export type IConfigurableProductTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IContact = {
  emailAddress?: Maybe<Scalars['String']['output']>;
  telNumber?: Maybe<Scalars['String']['output']>;
};

export type IContactInput = {
  emailAddress?: InputMaybe<Scalars['String']['input']>;
  telNumber?: InputMaybe<Scalars['String']['input']>;
};

export type IContractConfiguration = {
  ercMetadataProperties?: Maybe<Scalars['JSON']['output']>;
  supply: Scalars['Int']['output'];
  tokenId: Scalars['String']['output'];
};

export type ICountry = {
  _id: Scalars['ID']['output'];
  defaultCurrency?: Maybe<ICurrency>;
  flagEmoji?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  isBase?: Maybe<Scalars['Boolean']['output']>;
  /** ISO 3166-1 alpha-2 https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements */
  isoCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};


export type ICountryNameArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type ICreateAssortmentInput = {
  isRoot?: InputMaybe<Scalars['Boolean']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};

export type ICreateCountryInput = {
  isoCode: Scalars['String']['input'];
};

export type ICreateCurrencyInput = {
  contractAddress?: InputMaybe<Scalars['String']['input']>;
  decimals?: InputMaybe<Scalars['Int']['input']>;
  isoCode: Scalars['String']['input'];
};

export type ICreateDeliveryProviderInput = {
  adapterKey: Scalars['String']['input'];
  type: IDeliveryProviderType;
};

export type ICreateFilterInput = {
  key: Scalars['String']['input'];
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  type: IFilterType;
};

export type ICreateLanguageInput = {
  isoCode: Scalars['String']['input'];
};

export type ICreatePaymentProviderInput = {
  adapterKey: Scalars['String']['input'];
  type: IPaymentProviderType;
};

export type ICreateProductBundleItemInput = {
  productId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
};

export type ICreateProductInput = {
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
  type: Scalars['String']['input'];
};

export type ICreateProductVariationInput = {
  key: Scalars['String']['input'];
  type: IProductVariationType;
};

export type ICreateWarehousingProviderInput = {
  adapterKey: Scalars['String']['input'];
  type: IWarehousingProviderType;
};

export type ICurrency = {
  _id: Scalars['ID']['output'];
  contractAddress?: Maybe<Scalars['String']['output']>;
  decimals?: Maybe<Scalars['Int']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  isoCode: Scalars['String']['output'];
};

export type IDateFilterInput = {
  end?: InputMaybe<Scalars['DateTimeISO']['input']>;
  start?: InputMaybe<Scalars['DateTimeISO']['input']>;
};

export type IDeliveryInterface = {
  _id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type IDeliveryProvider = {
  _id: Scalars['ID']['output'];
  configuration?: Maybe<Scalars['JSON']['output']>;
  configurationError?: Maybe<IDeliveryProviderError>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  interface?: Maybe<IDeliveryInterface>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  simulatedPrice?: Maybe<IPrice>;
  type?: Maybe<IDeliveryProviderType>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


export type IDeliveryProviderSimulatedPriceArgs = {
  context?: InputMaybe<Scalars['JSON']['input']>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum IDeliveryProviderError {
  AdapterNotFound = 'ADAPTER_NOT_FOUND',
  IncompleteConfiguration = 'INCOMPLETE_CONFIGURATION',
  NotImplemented = 'NOT_IMPLEMENTED',
  WrongCredentials = 'WRONG_CREDENTIALS'
}

export type IDeliveryProviderPickUp = IDeliveryProvider & {
  _id: Scalars['ID']['output'];
  configuration?: Maybe<Scalars['JSON']['output']>;
  configurationError?: Maybe<IDeliveryProviderError>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  interface?: Maybe<IDeliveryInterface>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  pickUpLocations: Array<IPickUpLocation>;
  simulatedPrice?: Maybe<IPrice>;
  type?: Maybe<IDeliveryProviderType>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


export type IDeliveryProviderPickUpSimulatedPriceArgs = {
  context?: InputMaybe<Scalars['JSON']['input']>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};

export type IDeliveryProviderShipping = IDeliveryProvider & {
  _id: Scalars['ID']['output'];
  configuration?: Maybe<Scalars['JSON']['output']>;
  configurationError?: Maybe<IDeliveryProviderError>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  interface?: Maybe<IDeliveryInterface>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  simulatedPrice?: Maybe<IPrice>;
  type?: Maybe<IDeliveryProviderType>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


export type IDeliveryProviderShippingSimulatedPriceArgs = {
  context?: InputMaybe<Scalars['JSON']['input']>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum IDeliveryProviderType {
  /** Pick-Up */
  Pickup = 'PICKUP',
  /** Shipping */
  Shipping = 'SHIPPING'
}

export type IDimensions = {
  height?: Maybe<Scalars['Float']['output']>;
  length?: Maybe<Scalars['Float']['output']>;
  weight?: Maybe<Scalars['Float']['output']>;
  width?: Maybe<Scalars['Float']['output']>;
};


export type IDimensionsHeightArgs = {
  unit?: InputMaybe<ILengthUnit>;
};


export type IDimensionsLengthArgs = {
  unit?: InputMaybe<ILengthUnit>;
};


export type IDimensionsWeightArgs = {
  unit?: InputMaybe<IMassUnit>;
};


export type IDimensionsWidthArgs = {
  unit?: InputMaybe<ILengthUnit>;
};

export type IDiscountInterface = {
  _id: Scalars['ID']['output'];
  isManualAdditionAllowed?: Maybe<Scalars['Boolean']['output']>;
  isManualRemovalAllowed?: Maybe<Scalars['Boolean']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type IDispatch = {
  deliveryProvider?: Maybe<IDeliveryProvider>;
  earliestDelivery?: Maybe<Scalars['DateTimeISO']['output']>;
  shipping?: Maybe<Scalars['DateTimeISO']['output']>;
  warehousingProvider?: Maybe<IWarehousingProvider>;
};

/** Enrollment */
export type IEnrollment = {
  _id: Scalars['ID']['output'];
  billingAddress?: Maybe<IAddress>;
  contact?: Maybe<IContact>;
  country?: Maybe<ICountry>;
  created: Scalars['DateTimeISO']['output'];
  currency?: Maybe<ICurrency>;
  delivery?: Maybe<IEnrollmentDelivery>;
  enrollmentNumber?: Maybe<Scalars['String']['output']>;
  expires?: Maybe<Scalars['DateTimeISO']['output']>;
  isExpired?: Maybe<Scalars['Boolean']['output']>;
  payment?: Maybe<IEnrollmentPayment>;
  periods: Array<IEnrollmentPeriod>;
  plan: IEnrollmentPlan;
  status: IEnrollmentStatus;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
  user: IUser;
};


/** Enrollment */
export type IEnrollmentIsExpiredArgs = {
  referenceDate?: InputMaybe<Scalars['Timestamp']['input']>;
};

export type IEnrollmentDelivery = {
  provider?: Maybe<IDeliveryProvider>;
};

export type IEnrollmentDeliveryInput = {
  deliveryProviderId: Scalars['ID']['input'];
  meta?: InputMaybe<Scalars['JSON']['input']>;
};

export type IEnrollmentPayment = {
  provider?: Maybe<IPaymentProvider>;
};

export type IEnrollmentPaymentInput = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  paymentProviderId: Scalars['ID']['input'];
};

export type IEnrollmentPeriod = {
  end: Scalars['DateTimeISO']['output'];
  isTrial: Scalars['Boolean']['output'];
  order?: Maybe<IOrder>;
  start: Scalars['DateTimeISO']['output'];
};

export type IEnrollmentPlan = {
  configuration?: Maybe<Array<IProductConfigurationParameter>>;
  product: IPlanProduct;
  quantity: Scalars['Int']['output'];
};

export type IEnrollmentPlanInput = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  productId: Scalars['ID']['input'];
  quantity?: InputMaybe<Scalars['Int']['input']>;
};

export enum IEnrollmentStatus {
  /** Active Enrollment */
  Active = 'ACTIVE',
  /** Initial */
  Initial = 'INITIAL',
  /** Paused because of overdue payments */
  Paused = 'PAUSED',
  /** Terminated / Ended enrollment */
  Terminated = 'TERMINATED'
}

export type IEvent = {
  _id: Scalars['ID']['output'];
  created: Scalars['Timestamp']['output'];
  payload?: Maybe<Scalars['JSON']['output']>;
  type: Scalars['String']['output'];
};

export type IEventStatisticReport = {
  count: Scalars['Int']['output'];
  date: Scalars['Date']['output'];
};

export type IEventStatistics = {
  detail: Array<IEventStatisticReport>;
  emitCount: Scalars['Int']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export enum IEventType {
  ApiLoginTokenCreated = 'API_LOGIN_TOKEN_CREATED',
  ApiLogout = 'API_LOGOUT',
  AssortmentAddFilter = 'ASSORTMENT_ADD_FILTER',
  AssortmentAddLink = 'ASSORTMENT_ADD_LINK',
  AssortmentAddMedia = 'ASSORTMENT_ADD_MEDIA',
  AssortmentAddProduct = 'ASSORTMENT_ADD_PRODUCT',
  AssortmentCreate = 'ASSORTMENT_CREATE',
  AssortmentRemove = 'ASSORTMENT_REMOVE',
  AssortmentRemoveFilter = 'ASSORTMENT_REMOVE_FILTER',
  AssortmentRemoveLink = 'ASSORTMENT_REMOVE_LINK',
  AssortmentRemoveMedia = 'ASSORTMENT_REMOVE_MEDIA',
  AssortmentRemoveProduct = 'ASSORTMENT_REMOVE_PRODUCT',
  AssortmentReorderFilters = 'ASSORTMENT_REORDER_FILTERS',
  AssortmentReorderLinks = 'ASSORTMENT_REORDER_LINKS',
  AssortmentReorderMedia = 'ASSORTMENT_REORDER_MEDIA',
  AssortmentReorderProducts = 'ASSORTMENT_REORDER_PRODUCTS',
  AssortmentSetBase = 'ASSORTMENT_SET_BASE',
  AssortmentUpdate = 'ASSORTMENT_UPDATE',
  AssortmentUpdateMediaText = 'ASSORTMENT_UPDATE_MEDIA_TEXT',
  AssortmentUpdateText = 'ASSORTMENT_UPDATE_TEXT',
  BookmarkCreate = 'BOOKMARK_CREATE',
  BookmarkRemove = 'BOOKMARK_REMOVE',
  BookmarkUpdate = 'BOOKMARK_UPDATE',
  CountryCreate = 'COUNTRY_CREATE',
  CountryRemove = 'COUNTRY_REMOVE',
  CountryUpdate = 'COUNTRY_UPDATE',
  CurrencyCreate = 'CURRENCY_CREATE',
  CurrencyRemove = 'CURRENCY_REMOVE',
  CurrencyUpdate = 'CURRENCY_UPDATE',
  DeliveryProviderCreate = 'DELIVERY_PROVIDER_CREATE',
  DeliveryProviderRemove = 'DELIVERY_PROVIDER_REMOVE',
  DeliveryProviderUpdate = 'DELIVERY_PROVIDER_UPDATE',
  EnrollmentAddPeriod = 'ENROLLMENT_ADD_PERIOD',
  EnrollmentCreate = 'ENROLLMENT_CREATE',
  EnrollmentRemove = 'ENROLLMENT_REMOVE',
  EnrollmentUpdate = 'ENROLLMENT_UPDATE',
  FileCreate = 'FILE_CREATE',
  FileRemove = 'FILE_REMOVE',
  FileUpdate = 'FILE_UPDATE',
  FilterCreate = 'FILTER_CREATE',
  FilterRemove = 'FILTER_REMOVE',
  FilterUpdate = 'FILTER_UPDATE',
  FilterUpdateText = 'FILTER_UPDATE_TEXT',
  LanguageCreate = 'LANGUAGE_CREATE',
  LanguageRemove = 'LANGUAGE_REMOVE',
  LanguageUpdate = 'LANGUAGE_UPDATE',
  OrderAddProduct = 'ORDER_ADD_PRODUCT',
  OrderCheckout = 'ORDER_CHECKOUT',
  OrderConfirmed = 'ORDER_CONFIRMED',
  OrderCreate = 'ORDER_CREATE',
  OrderCreateDiscount = 'ORDER_CREATE_DISCOUNT',
  OrderDeliver = 'ORDER_DELIVER',
  OrderEmptyCart = 'ORDER_EMPTY_CART',
  OrderFullfilled = 'ORDER_FULLFILLED',
  OrderPay = 'ORDER_PAY',
  OrderRejected = 'ORDER_REJECTED',
  OrderRemove = 'ORDER_REMOVE',
  OrderRemoveCartItem = 'ORDER_REMOVE_CART_ITEM',
  OrderRemoveDiscount = 'ORDER_REMOVE_DISCOUNT',
  OrderSetDeliveryProvider = 'ORDER_SET_DELIVERY_PROVIDER',
  OrderSetPaymentProvider = 'ORDER_SET_PAYMENT_PROVIDER',
  OrderSignPayment = 'ORDER_SIGN_PAYMENT',
  OrderUpdate = 'ORDER_UPDATE',
  OrderUpdateCartItem = 'ORDER_UPDATE_CART_ITEM',
  OrderUpdateDelivery = 'ORDER_UPDATE_DELIVERY',
  OrderUpdateDiscount = 'ORDER_UPDATE_DISCOUNT',
  OrderUpdatePayment = 'ORDER_UPDATE_PAYMENT',
  PageView = 'PAGE_VIEW',
  PaymentProviderCreate = 'PAYMENT_PROVIDER_CREATE',
  PaymentProviderRemove = 'PAYMENT_PROVIDER_REMOVE',
  PaymentProviderUpdate = 'PAYMENT_PROVIDER_UPDATE',
  ProductAddAssignment = 'PRODUCT_ADD_ASSIGNMENT',
  ProductAddMedia = 'PRODUCT_ADD_MEDIA',
  ProductCreate = 'PRODUCT_CREATE',
  ProductCreateBundleItem = 'PRODUCT_CREATE_BUNDLE_ITEM',
  ProductCreateVariation = 'PRODUCT_CREATE_VARIATION',
  ProductPublish = 'PRODUCT_PUBLISH',
  ProductRemove = 'PRODUCT_REMOVE',
  ProductRemoveAssignment = 'PRODUCT_REMOVE_ASSIGNMENT',
  ProductRemoveBundleItem = 'PRODUCT_REMOVE_BUNDLE_ITEM',
  ProductRemoveMedia = 'PRODUCT_REMOVE_MEDIA',
  ProductRemoveReview = 'PRODUCT_REMOVE_REVIEW',
  ProductRemoveReviewVote = 'PRODUCT_REMOVE_REVIEW_VOTE',
  ProductRemoveVariation = 'PRODUCT_REMOVE_VARIATION',
  ProductRemoveVariationOption = 'PRODUCT_REMOVE_VARIATION_OPTION',
  ProductReorderMedia = 'PRODUCT_REORDER_MEDIA',
  ProductReviewAddVote = 'PRODUCT_REVIEW_ADD_VOTE',
  ProductReviewCreate = 'PRODUCT_REVIEW_CREATE',
  ProductSetBase = 'PRODUCT_SET_BASE',
  ProductUnpublish = 'PRODUCT_UNPUBLISH',
  ProductUpdate = 'PRODUCT_UPDATE',
  ProductUpdateMediaText = 'PRODUCT_UPDATE_MEDIA_TEXT',
  ProductUpdateReview = 'PRODUCT_UPDATE_REVIEW',
  ProductUpdateText = 'PRODUCT_UPDATE_TEXT',
  ProductUpdateVariationText = 'PRODUCT_UPDATE_VARIATION_TEXT',
  ProductVariationOptionCreate = 'PRODUCT_VARIATION_OPTION_CREATE',
  QuotationRemove = 'QUOTATION_REMOVE',
  QuotationRequestCreate = 'QUOTATION_REQUEST_CREATE',
  QuotationUpdate = 'QUOTATION_UPDATE',
  TokenInvalidated = 'TOKEN_INVALIDATED',
  TokenOwnershipChanged = 'TOKEN_OWNERSHIP_CHANGED',
  Unknown = 'UNKNOWN',
  UserAccountAction = 'USER_ACCOUNT_ACTION',
  UserAddRoles = 'USER_ADD_ROLES',
  UserCreate = 'USER_CREATE',
  UserRemove = 'USER_REMOVE',
  UserUpdate = 'USER_UPDATE',
  UserUpdateAvatar = 'USER_UPDATE_AVATAR',
  UserUpdateBillingAddress = 'USER_UPDATE_BILLING_ADDRESS',
  UserUpdateGuest = 'USER_UPDATE_GUEST',
  UserUpdateHeartbeat = 'USER_UPDATE_HEARTBEAT',
  UserUpdateLastContact = 'USER_UPDATE_LAST_CONTACT',
  UserUpdatePassword = 'USER_UPDATE_PASSWORD',
  UserUpdateProfile = 'USER_UPDATE_PROFILE',
  UserUpdateRole = 'USER_UPDATE_ROLE',
  UserUpdateTags = 'USER_UPDATE_TAGS',
  UserUpdateUsername = 'USER_UPDATE_USERNAME',
  WarehousingProviderCreate = 'WAREHOUSING_PROVIDER_CREATE',
  WarehousingProviderRemove = 'WAREHOUSING_PROVIDER_REMOVE',
  WarehousingProviderUpdate = 'WAREHOUSING_PROVIDER_UPDATE',
  WorkAdded = 'WORK_ADDED',
  WorkAllocated = 'WORK_ALLOCATED',
  WorkDeleted = 'WORK_DELETED',
  WorkFinished = 'WORK_FINISHED',
  WorkRescheduled = 'WORK_RESCHEDULED'
}

export enum IExternalLinkTarget {
  /** Open on new tab */
  Blank = 'BLANK',
  /** Open in own Iframe */
  Self = 'SELF'
}

export type IFilter = {
  _id: Scalars['ID']['output'];
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  options?: Maybe<Array<IFilterOption>>;
  texts?: Maybe<IFilterTexts>;
  type?: Maybe<IFilterType>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


export type IFilterTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IFilterOption = {
  _id: Scalars['ID']['output'];
  texts?: Maybe<IFilterTexts>;
  value?: Maybe<Scalars['String']['output']>;
};


export type IFilterOptionTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IFilterQueryInput = {
  key: Scalars['String']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

export type IFilterTextInput = {
  locale: Scalars['Locale']['input'];
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type IFilterTexts = {
  _id: Scalars['ID']['output'];
  locale: Scalars['Locale']['output'];
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export enum IFilterType {
  /** Multi-choice */
  MultiChoice = 'MULTI_CHOICE',
  /** Range */
  Range = 'RANGE',
  /** Single-choice */
  SingleChoice = 'SINGLE_CHOICE',
  /** Switch / Boolean */
  Switch = 'SWITCH'
}

export type IGeoPosition = {
  altitute?: Maybe<Scalars['Float']['output']>;
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
};

export type ILanguage = {
  _id: Scalars['ID']['output'];
  isActive?: Maybe<Scalars['Boolean']['output']>;
  isBase?: Maybe<Scalars['Boolean']['output']>;
  /** ISO 639-1 alpha-2 https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes */
  isoCode?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export enum ILengthUnit {
  Feet = 'FEET',
  Meters = 'METERS',
  Millimeters = 'MILLIMETERS'
}

export type ILoadedFilter = {
  definition: IFilter;
  filteredProductsCount: Scalars['Int']['output'];
  isSelected?: Maybe<Scalars['Boolean']['output']>;
  options?: Maybe<Array<ILoadedFilterOption>>;
  productsCount: Scalars['Int']['output'];
};

export type ILoadedFilterOption = {
  definition: IFilterOption;
  filteredProductsCount: Scalars['Int']['output'];
  isSelected?: Maybe<Scalars['Boolean']['output']>;
};

/** Type returned when the user logs in */
export type ILoginMethodResponse = {
  /** Session ID */
  _id: Scalars['String']['output'];
  /** Expiration date for the token */
  tokenExpires: Scalars['DateTimeISO']['output'];
  /** The logged in user */
  user?: Maybe<IUser>;
};

export enum IMassUnit {
  Gram = 'GRAM',
  Kilogram = 'KILOGRAM',
  Pounds = 'POUNDS'
}

export type IMedia = {
  _id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  type: Scalars['String']['output'];
  url?: Maybe<Scalars['String']['output']>;
};


export type IMediaUrlArgs = {
  baseUrl?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};

export type IMediaUploadTicket = {
  _id: Scalars['ID']['output'];
  expires: Scalars['DateTimeISO']['output'];
  putURL: Scalars['String']['output'];
};

export type IMutation = {
  /** Activate a enrollment by changing the status to ACTIVE */
  activateEnrollment: IEnrollment;
  /** Add a new filter to an assortment */
  addAssortmentFilter: IAssortmentFilter;
  /** Add a new child assortment to an assortment */
  addAssortmentLink: IAssortmentLink;
  /** Add a new product to an assortment */
  addAssortmentProduct: IAssortmentProduct;
  /** Add a new discount to the cart, a new order gets generated with status = open (= order before checkout / cart) if necessary */
  addCartDiscount: IOrderDiscount;
  /** Add a new item to the cart. Order gets generated with status = open (= order before checkout / cart) if necessary. */
  addCartProduct: IOrderItem;
  /** Add a new quotation to the cart. */
  addCartQuotation: IOrderItem;
  /** Update E-Mail address of any user or logged in user if userId is not provided */
  addEmail: IUser;
  /** Add multiple new item to the cart. Order gets generated with status = open (= order before checkout / cart) if necessary. */
  addMultipleCartProducts: IOrder;
  /**
   * Link a new product to a ConfigurableProduct by providing a configuration
   * combination that uniquely identifies a row in the assignment matrix
   */
  addProductAssignment: IProduct;
  /**
   * Add a vote to a ProductReview.
   * If there there is a previous vote from the user invoking this it will be removed and updated with the new vote
   */
  addProductReviewVote: IProductReview;
  /** Store user W3C Push subscription object */
  addPushSubscription: IUser;
  /** Web3 */
  addWeb3Address: IUser;
  /** Register WebAuthn Credentials for current user */
  addWebAuthnCredentials: IUser;
  /**
   * Add work to the work queue. Each type has its own input shape. If you pinpoint the worker by setting it
   * during creation, the work will be only run by the worker who identifies as that worker.
   */
  addWork?: Maybe<IWork>;
  /**
   * Get the next task from the worker queue. This will also mark the task as "started".
   * Optional worker to identify the worker.
   */
  allocateWork?: Maybe<IWork>;
  /**
   * Toggle Bookmark state on a product as currently logged in user,
   * Does not work when multiple bookmarks with different explicit meta configurations exist.
   * In those cases please use createBookmark and removeBookmark
   */
  bookmark: IBookmark;
  /** Change the current user's password. Must be logged in. */
  changePassword?: Maybe<ISuccessResponse>;
  /**
   * Process the checkout (automatically charge & deliver if possible), the cart will get
   * transformed to an ordinary order if everything goes well.
   */
  checkoutCart: IOrder;
  confirmMediaUpload: IMedia;
  /** Manually confirm an order which is in progress */
  confirmOrder: IOrder;
  /** Creates new assortment. */
  createAssortment: IAssortment;
  /** Create a bookmark for a specific user */
  createBookmark: IBookmark;
  /**
   * Creates an alternative cart. If you use this feature, you should use explicit orderId's when using the
   * cart mutations. Else it will work like a stack and the checkout will use the very first cart of the user.
   */
  createCart: IOrder;
  createCountry: ICountry;
  createCurrency: ICurrency;
  /** Creates new delivery provider */
  createDeliveryProvider: IDeliveryProvider;
  /** Create a enrollment. */
  createEnrollment: IEnrollment;
  /** Creates new Filter along with the user who created it. */
  createFilter: IFilter;
  /** Adds new option to filters */
  createFilterOption: IFilter;
  /** Adds new language along with the user who created it */
  createLanguage: ILanguage;
  /** Adds new payment provider */
  createPaymentProvider: IPaymentProvider;
  /** Create a new product */
  createProduct: IProduct;
  /** Adds one product as bundle for another products */
  createProductBundleItem: IProduct;
  /** Add a new ProductReview */
  createProductReview: IProductReview;
  /** Creates new product variation for a product. */
  createProductVariation: IProductVariation;
  /** Adds variation option to an existing product variations */
  createProductVariationOption: IProductVariation;
  /** Create a new user. */
  createUser?: Maybe<ILoginMethodResponse>;
  /** Creates new warehouse provider. */
  createWarehousingProvider: IWarehousingProvider;
  /** Create WebAuthn PublicKeyCredentialCreationOptions to use for Registering a new WebAuthn Device */
  createWebAuthnCredentialCreationOptions?: Maybe<Scalars['JSON']['output']>;
  /** Create WebAuthn PublicKeyCredentialRequestrOptions to use for WebAuthn Login Flow */
  createWebAuthnCredentialRequestOptions?: Maybe<Scalars['JSON']['output']>;
  /** Manually mark a undelivered order as delivered */
  deliverOrder: IOrder;
  /**
   * Remove all items of an open order (cart) if possible.
   * if you want to remove single cart item use removeCartItem instead
   */
  emptyCart?: Maybe<IOrder>;
  /** Enroll a new user, setting enroll to true will let the user choose his password (e-mail gets sent) */
  enrollUser: IUser;
  exportToken: IToken;
  /**
   * Register a work attempt manually.
   * Note: Usually, work attempts are handled internally by the inbuilt cron
   * worker. This mutation is part of the interface for "outside" workers.
   */
  finishWork: IWork;
  /** Request a forgot password email. */
  forgotPassword?: Maybe<ISuccessResponse>;
  /**
   * Update hearbeat (updates user activity information such as last
   * login and logged in user IP address, locale and country where they
   * accessed the system)
   */
  heartbeat: IUser;
  /** Impersonate a user */
  impersonate: ILoginMethodResponse;
  /** Tokenize */
  invalidateToken: IToken;
  /** Login as Guest User (creates an anonymous user and returns logged in token) */
  loginAsGuest?: Maybe<ILoginMethodResponse>;
  /** Log the user in with a password. */
  loginWithPassword?: Maybe<ILoginMethodResponse>;
  /** Log the user in with a WebAuthn device */
  loginWithWebAuthn?: Maybe<ILoginMethodResponse>;
  /** Log the user out. */
  logout?: Maybe<ISuccessResponse>;
  /** Make a proposal as answer to the RFP by changing its status to PROCESSED */
  makeQuotationProposal: IQuotation;
  /** Make's the provided payment credential as the users preferred method of payment. */
  markPaymentCredentialsPreferred?: Maybe<IPaymentCredentials>;
  pageView: Scalars['String']['output'];
  /** Manually mark an unpaid/partially paid order as fully paid */
  payOrder: IOrder;
  prepareAssortmentMediaUpload: IMediaUploadTicket;
  prepareProductMediaUpload: IMediaUploadTicket;
  prepareUserAvatarUpload: IMediaUploadTicket;
  /**
   * This will pick up non-external work, execute, await result and finish
   * it up on the target system. This function allows you to do work queue "ticks"
   * from outside instead of waiting for default Cron and Event Listener to trigger
   * and can be helpful in serverless environments.
   */
  processNextWork?: Maybe<IWork>;
  /** Make the product visible on any shop listings (product queries) */
  publishProduct: IProduct;
  /**
   * Register credentials for an existing payment provider allowing to store and use them
   * for later payments (1-click checkout or enrollments)
   */
  registerPaymentCredentials?: Maybe<IPaymentCredentials>;
  /** Manually reject an order which is in progress */
  rejectOrder: IOrder;
  /** Reject an RFP, this is possible as long as a quotation is not fullfilled */
  rejectQuotation: IQuotation;
  /** Removes assortment with the provided ID */
  removeAssortment: IAssortment;
  /** Remove a product from an assortment */
  removeAssortmentFilter: IAssortmentFilter;
  /** Remove a child/parent assortment link from it's parent */
  removeAssortmentLink: IAssortmentLink;
  /** Remove a media asset from a assortment */
  removeAssortmentMedia: IAssortmentMedia;
  /** Remove a product from an assortment */
  removeAssortmentProduct: IAssortmentProduct;
  /** Remove an existing bookmark by ID */
  removeBookmark: IBookmark;
  /** Removes products bundle item found at the given 0 based index. */
  removeBundleItem: IProduct;
  /** Remove a discount from the cart */
  removeCartDiscount: IOrderDiscount;
  /** Remove an item from an open order */
  removeCartItem: IOrderItem;
  /** Deletes the specified country */
  removeCountry: ICountry;
  /** Deletes the specified currency */
  removeCurrency: ICurrency;
  /**
   * Deletes a delivery provider by setting the deleted field to current timestamp.
   * Note the delivery provider still exists.
   */
  removeDeliveryProvider: IDeliveryProvider;
  /** Update E-Mail address of any user or logged in user if userId is not provided */
  removeEmail: IUser;
  /** Deletes the specified filter */
  removeFilter: IFilter;
  /** Removes the filter option from the specified filter. */
  removeFilterOption: IFilter;
  /** Deletes the specified languages */
  removeLanguage: ILanguage;
  /** Remove an order while it's still open */
  removeOrder: IOrder;
  /** Deletes the specified payment credential. */
  removePaymentCredentials?: Maybe<IPaymentCredentials>;
  /**
   * Deletes the specified payment provider by setting the deleted filed to current timestamp.
   * Note the payment provider is still available only it’s status is deleted
   */
  removePaymentProvider: IPaymentProvider;
  /** Remove the product completely! */
  removeProduct: IProduct;
  /**
   * Unlinks a product from a ConfigurableProduct by providing a configuration
   * combination that uniquely identifies a row in the assignment matrix
   */
  removeProductAssignment: IProduct;
  /** Remove a media asset from a product's visualization */
  removeProductMedia: IProductMedia;
  /** Remove an existing ProductReview. The logic to allow/dissallow removal is controlled by product plugin logic */
  removeProductReview: IProductReview;
  /** Remove a vote from a ProductReview */
  removeProductReviewVote: IProductReview;
  /** Removes product variation with the provided ID */
  removeProductVariation: IProductVariation;
  /** Removes product option value for product variation with the provided variation option value */
  removeProductVariationOption: IProductVariation;
  /** Remove user W3C push subscription object */
  removePushSubscription: IUser;
  /** Remove any user or logged in user if userId is not provided */
  removeUser: IUser;
  /** Remove product reviews of a user */
  removeUserProductReviews: Scalars['Boolean']['output'];
  /**
   * Deletes the specified warehousing provider by setting the deleted filed to current timestamp.
   * Note warehousing provider still exists in the system after successful
   * completing of this operation with status deleted.
   */
  removeWarehousingProvider: IWarehousingProvider;
  removeWeb3Address: IUser;
  /** Remove WebAuthn Credentials for current user */
  removeWebAuthnCredentials: IUser;
  /** Manually remove a work */
  removeWork: IWork;
  /** Reorder the products in an assortment */
  reorderAssortmentFilters: Array<IAssortmentFilter>;
  /** Reorder the child assortment links in it's parent */
  reorderAssortmentLinks: Array<IAssortmentLink>;
  /** Reorder a media asset (first is primary) */
  reorderAssortmentMedia: Array<IAssortmentMedia>;
  /** Reorder the products in an assortment */
  reorderAssortmentProducts: Array<IAssortmentProduct>;
  /** Reorder a media asset (first is primary) */
  reorderProductMedia: Array<IProductMedia>;
  /** Request for Proposal (RFP) for the specified product */
  requestQuotation: IQuotation;
  /** Reset the password for a user using a token received in email. Logs the user in afterwards. */
  resetPassword?: Maybe<ILoginMethodResponse>;
  /** Forcefully trigger an enrollment email for already added users by e-mail */
  sendEnrollmentEmail?: Maybe<ISuccessResponse>;
  /** Send an email with a link the user can use verify their email address. */
  sendVerificationEmail?: Maybe<ISuccessResponse>;
  /**
   * Makes the assortment provided as the base assortment and make
   * any other existing base assortment regular assortments.
   */
  setBaseAssortment: IAssortment;
  /**
   * Change the delivery method/provider to an order. If the delivery provider
   * doesn’t exists new delivery provider will be created with the provided ID.
   * @deprecated Use updateCart or updateCartDelivery* mutations instead
   */
  setOrderDeliveryProvider: IOrder;
  /**
   * Change the payment method/provider to an order. If the payment provider
   * doesn’t exists new payment provider will be created with the provided ID.
   * @deprecated Use updateCart or updateCartPayment* mutations instead
   */
  setOrderPaymentProvider: IOrder;
  /** Set a new password for a specific user */
  setPassword: IUser;
  /** Set roles of a user */
  setRoles: IUser;
  /** Set tags of user */
  setUserTags: IUser;
  /** Set username for a specific user */
  setUsername: IUser;
  /** Sign a generic order payment */
  signPaymentProviderForCheckout: Scalars['String']['output'];
  /** Sign a generic payment provider for registration */
  signPaymentProviderForCredentialRegistration?: Maybe<Scalars['String']['output']>;
  /** End customer impersonated user session and resume the impersonator session */
  stopImpersonation?: Maybe<ILoginMethodResponse>;
  /** Terminate an actively running enrollment by changing it's status to TERMINATED */
  terminateEnrollment: IEnrollment;
  /** Hide the product visible from any shop listings (product queries) */
  unpublishProduct: IProduct;
  /** Updates the provided assortment */
  updateAssortment: IAssortment;
  /** Modify localized texts part of a assortment media asset */
  updateAssortmentMediaTexts: Array<IAssortmentMediaTexts>;
  /** Modify localized texts part of an assortment */
  updateAssortmentTexts: Array<IAssortmentTexts>;
  /**
   * Change billing address and order contact of an open order (cart). All of the parameters
   * except order ID are optional and the update will ocure for parameters provided.
   * If the delivery provider or payment provider ID provided doesn’t already exist new order payment
   * will be created with the provided ID.
   */
  updateCart: IOrder;
  /** Update the cart by changing the delivery provider and using a pick up specific configuration */
  updateCartDeliveryPickUp: IOrder;
  /** Update the cart by changing the delivery provider and using a shipping specific configuration */
  updateCartDeliveryShipping: IOrder;
  /**
   * Change the quantity or configuration of an item in an open order.align-baselineAll
   * of the parameters are optional except item ID and for the parameters provided the
   * update will be performed accordingly.
   */
  updateCartItem: IOrderItem;
  /** Update the cart by changing the payment provider and using a generic specific configuration */
  updateCartPaymentGeneric: IOrder;
  /** Update the cart by changing the payment provider and using an invoice-type specific configuration */
  updateCartPaymentInvoice: IOrder;
  /** Updates provided country information */
  updateCountry: ICountry;
  /** Updates the specified currency */
  updateCurrency: ICurrency;
  /** Updates the delivery provider specified */
  updateDeliveryProvider: IDeliveryProvider;
  /** Update a enrollment */
  updateEnrollment: IEnrollment;
  /** Updates the specified filter with the information passed. */
  updateFilter: IFilter;
  /** Updates or created specified filter texts for filter with ID provided and locale and optionally filterOptionValue */
  updateFilterTexts: Array<IFilterTexts>;
  /** Updates the specified language. */
  updateLanguage: ILanguage;
  /**
   * Update a Pick Up Delivery Provider's specific configuration
   * @deprecated Use updateCartDeliveryPickUp instead
   */
  updateOrderDeliveryPickUp: IOrderDeliveryPickUp;
  /**
   * Update a Shipping Delivery Provider's specific configuration
   * @deprecated Use updateCartDeliveryShipping instead
   */
  updateOrderDeliveryShipping: IOrderDeliveryShipping;
  /**
   * Update a Generic Payment Provider's specific configuration
   * @deprecated Use updateCartPaymentGeneric instead
   */
  updateOrderPaymentGeneric: IOrderPaymentGeneric;
  /**
   * Update an Invoice Payment Provider's specific configuration
   * @deprecated Use updateCartPaymentInvoice instead
   */
  updateOrderPaymentInvoice: IOrderPaymentInvoice;
  /** Updates payment provider information with the provided ID */
  updatePaymentProvider: IPaymentProvider;
  /** Modify generic infos of a product (tags for ex.) */
  updateProduct?: Maybe<IProduct>;
  /** Modify commerce part of a product */
  updateProductCommerce?: Maybe<IProduct>;
  /** Modify localized texts part of a product's media asset */
  updateProductMediaTexts: Array<IProductMediaTexts>;
  /** Modify plan part of a product */
  updateProductPlan?: Maybe<IProduct>;
  /** Update an existing ProductReview. The logic to allow/dissallow editing is controlled by product plugin logic */
  updateProductReview: IProductReview;
  /** Modify delivery part of a product */
  updateProductSupply?: Maybe<IProduct>;
  /** Modify localized texts part of a product */
  updateProductTexts: Array<IProductTexts>;
  /** Modify tokenization part of a product */
  updateProductTokenization?: Maybe<ITokenizedProduct>;
  /**
   * Update product variation texts with the specified locales for product variations
   * that match the provided variation ID and production option value
   */
  updateProductVariationTexts: Array<IProductVariationTexts>;
  /** Modify warehousing part of a product */
  updateProductWarehousing?: Maybe<IProduct>;
  /** Update Profile of any user or logged in user if userId is not provided */
  updateUserProfile: IUser;
  /** Updates warehousing provider information with the provided ID */
  updateWarehousingProvider: IWarehousingProvider;
  /** Marks the user's email address as verified. Logs the user in afterwards. */
  verifyEmail?: Maybe<ILoginMethodResponse>;
  /** Verify quotation request elligibility. and marks requested quotations as verified if it is */
  verifyQuotation: IQuotation;
  verifyWeb3Address: IUser;
};


export type IMutationActivateEnrollmentArgs = {
  enrollmentId: Scalars['ID']['input'];
};


export type IMutationAddAssortmentFilterArgs = {
  assortmentId: Scalars['ID']['input'];
  filterId: Scalars['ID']['input'];
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IMutationAddAssortmentLinkArgs = {
  childAssortmentId: Scalars['ID']['input'];
  parentAssortmentId: Scalars['ID']['input'];
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IMutationAddAssortmentProductArgs = {
  assortmentId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IMutationAddCartDiscountArgs = {
  code: Scalars['String']['input'];
  orderId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationAddCartProductArgs = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  productId: Scalars['ID']['input'];
  quantity?: InputMaybe<Scalars['Int']['input']>;
};


export type IMutationAddCartQuotationArgs = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  quotationId: Scalars['ID']['input'];
};


export type IMutationAddEmailArgs = {
  email: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationAddMultipleCartProductsArgs = {
  items: Array<IOrderItemInput>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationAddProductAssignmentArgs = {
  productId: Scalars['ID']['input'];
  proxyId: Scalars['ID']['input'];
  vectors: Array<IProductAssignmentVectorInput>;
};


export type IMutationAddProductReviewVoteArgs = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  productReviewId: Scalars['ID']['input'];
  type: IProductReviewVoteType;
};


export type IMutationAddPushSubscriptionArgs = {
  subscription: Scalars['JSON']['input'];
  unsubscribeFromOtherUsers?: InputMaybe<Scalars['Boolean']['input']>;
};


export type IMutationAddWeb3AddressArgs = {
  address: Scalars['String']['input'];
};


export type IMutationAddWebAuthnCredentialsArgs = {
  credentials: Scalars['JSON']['input'];
};


export type IMutationAddWorkArgs = {
  input?: InputMaybe<Scalars['JSON']['input']>;
  originalWorkId?: InputMaybe<Scalars['ID']['input']>;
  priority?: Scalars['Int']['input'];
  retries?: Scalars['Int']['input'];
  scheduled?: InputMaybe<Scalars['Timestamp']['input']>;
  type: IWorkType;
  worker?: InputMaybe<Scalars['String']['input']>;
};


export type IMutationAllocateWorkArgs = {
  types?: InputMaybe<Array<InputMaybe<IWorkType>>>;
  worker?: InputMaybe<Scalars['String']['input']>;
};


export type IMutationBookmarkArgs = {
  bookmarked?: InputMaybe<Scalars['Boolean']['input']>;
  productId: Scalars['ID']['input'];
};


export type IMutationChangePasswordArgs = {
  newPassword: Scalars['String']['input'];
  oldPassword: Scalars['String']['input'];
};


export type IMutationCheckoutCartArgs = {
  deliveryContext?: InputMaybe<Scalars['JSON']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  paymentContext?: InputMaybe<Scalars['JSON']['input']>;
};


export type IMutationConfirmMediaUploadArgs = {
  mediaUploadTicketId: Scalars['ID']['input'];
  size: Scalars['Int']['input'];
  type: Scalars['String']['input'];
};


export type IMutationConfirmOrderArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  deliveryContext?: InputMaybe<Scalars['JSON']['input']>;
  orderId: Scalars['ID']['input'];
  paymentContext?: InputMaybe<Scalars['JSON']['input']>;
};


export type IMutationCreateAssortmentArgs = {
  assortment: ICreateAssortmentInput;
  texts?: InputMaybe<Array<IAssortmentTextInput>>;
};


export type IMutationCreateBookmarkArgs = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  productId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type IMutationCreateCartArgs = {
  orderNumber: Scalars['String']['input'];
};


export type IMutationCreateCountryArgs = {
  country: ICreateCountryInput;
};


export type IMutationCreateCurrencyArgs = {
  currency: ICreateCurrencyInput;
};


export type IMutationCreateDeliveryProviderArgs = {
  deliveryProvider: ICreateDeliveryProviderInput;
};


export type IMutationCreateEnrollmentArgs = {
  billingAddress?: InputMaybe<IAddressInput>;
  contact?: InputMaybe<IContactInput>;
  delivery?: InputMaybe<IEnrollmentDeliveryInput>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  payment?: InputMaybe<IEnrollmentPaymentInput>;
  plan: IEnrollmentPlanInput;
};


export type IMutationCreateFilterArgs = {
  filter: ICreateFilterInput;
  texts?: InputMaybe<Array<IFilterTextInput>>;
};


export type IMutationCreateFilterOptionArgs = {
  filterId: Scalars['ID']['input'];
  option: Scalars['String']['input'];
  texts?: InputMaybe<Array<IFilterTextInput>>;
};


export type IMutationCreateLanguageArgs = {
  language: ICreateLanguageInput;
};


export type IMutationCreatePaymentProviderArgs = {
  paymentProvider: ICreatePaymentProviderInput;
};


export type IMutationCreateProductArgs = {
  product: ICreateProductInput;
  texts?: InputMaybe<Array<IProductTextInput>>;
};


export type IMutationCreateProductBundleItemArgs = {
  item: ICreateProductBundleItemInput;
  productId: Scalars['ID']['input'];
};


export type IMutationCreateProductReviewArgs = {
  productId: Scalars['ID']['input'];
  productReview: IProductReviewInput;
};


export type IMutationCreateProductVariationArgs = {
  productId: Scalars['ID']['input'];
  texts?: InputMaybe<Array<IProductVariationTextInput>>;
  variation: ICreateProductVariationInput;
};


export type IMutationCreateProductVariationOptionArgs = {
  option: Scalars['String']['input'];
  productVariationId: Scalars['ID']['input'];
  texts?: InputMaybe<Array<IProductVariationTextInput>>;
};


export type IMutationCreateUserArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  profile?: InputMaybe<IUserProfileInput>;
  username?: InputMaybe<Scalars['String']['input']>;
  webAuthnPublicKeyCredentials?: InputMaybe<Scalars['JSON']['input']>;
};


export type IMutationCreateWarehousingProviderArgs = {
  warehousingProvider: ICreateWarehousingProviderInput;
};


export type IMutationCreateWebAuthnCredentialCreationOptionsArgs = {
  extensionOptions?: InputMaybe<Scalars['JSON']['input']>;
  username: Scalars['String']['input'];
};


export type IMutationCreateWebAuthnCredentialRequestOptionsArgs = {
  extensionOptions?: InputMaybe<Scalars['JSON']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type IMutationDeliverOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type IMutationEmptyCartArgs = {
  orderId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationEnrollUserArgs = {
  email: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  profile: IUserProfileInput;
};


export type IMutationExportTokenArgs = {
  quantity?: Scalars['Int']['input'];
  recipientWalletAddress: Scalars['String']['input'];
  tokenId: Scalars['ID']['input'];
};


export type IMutationFinishWorkArgs = {
  error?: InputMaybe<Scalars['JSON']['input']>;
  finished?: InputMaybe<Scalars['Timestamp']['input']>;
  result?: InputMaybe<Scalars['JSON']['input']>;
  started?: InputMaybe<Scalars['Timestamp']['input']>;
  success?: InputMaybe<Scalars['Boolean']['input']>;
  workId: Scalars['ID']['input'];
  worker?: InputMaybe<Scalars['String']['input']>;
};


export type IMutationForgotPasswordArgs = {
  email: Scalars['String']['input'];
};


export type IMutationImpersonateArgs = {
  userId: Scalars['ID']['input'];
};


export type IMutationInvalidateTokenArgs = {
  tokenId: Scalars['ID']['input'];
};


export type IMutationLoginWithPasswordArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  username?: InputMaybe<Scalars['String']['input']>;
};


export type IMutationLoginWithWebAuthnArgs = {
  webAuthnPublicKeyCredentials: Scalars['JSON']['input'];
};


export type IMutationMakeQuotationProposalArgs = {
  quotationContext?: InputMaybe<Scalars['JSON']['input']>;
  quotationId: Scalars['ID']['input'];
};


export type IMutationMarkPaymentCredentialsPreferredArgs = {
  paymentCredentialsId: Scalars['ID']['input'];
};


export type IMutationPageViewArgs = {
  path: Scalars['String']['input'];
  referrer?: InputMaybe<Scalars['String']['input']>;
};


export type IMutationPayOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type IMutationPrepareAssortmentMediaUploadArgs = {
  assortmentId: Scalars['ID']['input'];
  mediaName: Scalars['String']['input'];
};


export type IMutationPrepareProductMediaUploadArgs = {
  mediaName: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
};


export type IMutationPrepareUserAvatarUploadArgs = {
  mediaName: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationProcessNextWorkArgs = {
  worker?: InputMaybe<Scalars['String']['input']>;
};


export type IMutationPublishProductArgs = {
  productId: Scalars['ID']['input'];
};


export type IMutationRegisterPaymentCredentialsArgs = {
  paymentProviderId: Scalars['ID']['input'];
  transactionContext: Scalars['JSON']['input'];
};


export type IMutationRejectOrderArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  deliveryContext?: InputMaybe<Scalars['JSON']['input']>;
  orderId: Scalars['ID']['input'];
  paymentContext?: InputMaybe<Scalars['JSON']['input']>;
};


export type IMutationRejectQuotationArgs = {
  quotationContext?: InputMaybe<Scalars['JSON']['input']>;
  quotationId: Scalars['ID']['input'];
};


export type IMutationRemoveAssortmentArgs = {
  assortmentId: Scalars['ID']['input'];
};


export type IMutationRemoveAssortmentFilterArgs = {
  assortmentFilterId: Scalars['ID']['input'];
};


export type IMutationRemoveAssortmentLinkArgs = {
  assortmentLinkId: Scalars['ID']['input'];
};


export type IMutationRemoveAssortmentMediaArgs = {
  assortmentMediaId: Scalars['ID']['input'];
};


export type IMutationRemoveAssortmentProductArgs = {
  assortmentProductId: Scalars['ID']['input'];
};


export type IMutationRemoveBookmarkArgs = {
  bookmarkId: Scalars['ID']['input'];
};


export type IMutationRemoveBundleItemArgs = {
  index: Scalars['Int']['input'];
  productId: Scalars['ID']['input'];
};


export type IMutationRemoveCartDiscountArgs = {
  discountId: Scalars['ID']['input'];
};


export type IMutationRemoveCartItemArgs = {
  itemId: Scalars['ID']['input'];
};


export type IMutationRemoveCountryArgs = {
  countryId: Scalars['ID']['input'];
};


export type IMutationRemoveCurrencyArgs = {
  currencyId: Scalars['ID']['input'];
};


export type IMutationRemoveDeliveryProviderArgs = {
  deliveryProviderId: Scalars['ID']['input'];
};


export type IMutationRemoveEmailArgs = {
  email: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationRemoveFilterArgs = {
  filterId: Scalars['ID']['input'];
};


export type IMutationRemoveFilterOptionArgs = {
  filterId: Scalars['ID']['input'];
  filterOptionValue: Scalars['String']['input'];
};


export type IMutationRemoveLanguageArgs = {
  languageId: Scalars['ID']['input'];
};


export type IMutationRemoveOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type IMutationRemovePaymentCredentialsArgs = {
  paymentCredentialsId: Scalars['ID']['input'];
};


export type IMutationRemovePaymentProviderArgs = {
  paymentProviderId: Scalars['ID']['input'];
};


export type IMutationRemoveProductArgs = {
  productId: Scalars['ID']['input'];
};


export type IMutationRemoveProductAssignmentArgs = {
  proxyId: Scalars['ID']['input'];
  vectors: Array<IProductAssignmentVectorInput>;
};


export type IMutationRemoveProductMediaArgs = {
  productMediaId: Scalars['ID']['input'];
};


export type IMutationRemoveProductReviewArgs = {
  productReviewId: Scalars['ID']['input'];
};


export type IMutationRemoveProductReviewVoteArgs = {
  productReviewId: Scalars['ID']['input'];
  type?: InputMaybe<IProductReviewVoteType>;
};


export type IMutationRemoveProductVariationArgs = {
  productVariationId: Scalars['ID']['input'];
};


export type IMutationRemoveProductVariationOptionArgs = {
  productVariationId: Scalars['ID']['input'];
  productVariationOptionValue: Scalars['String']['input'];
};


export type IMutationRemovePushSubscriptionArgs = {
  p256dh: Scalars['String']['input'];
};


export type IMutationRemoveUserArgs = {
  removeUserReviews?: InputMaybe<Scalars['Boolean']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationRemoveUserProductReviewsArgs = {
  userId: Scalars['ID']['input'];
};


export type IMutationRemoveWarehousingProviderArgs = {
  warehousingProviderId: Scalars['ID']['input'];
};


export type IMutationRemoveWeb3AddressArgs = {
  address: Scalars['String']['input'];
};


export type IMutationRemoveWebAuthnCredentialsArgs = {
  credentialsId: Scalars['ID']['input'];
};


export type IMutationRemoveWorkArgs = {
  workId: Scalars['ID']['input'];
};


export type IMutationReorderAssortmentFiltersArgs = {
  sortKeys: Array<IReorderAssortmentFilterInput>;
};


export type IMutationReorderAssortmentLinksArgs = {
  sortKeys: Array<IReorderAssortmentLinkInput>;
};


export type IMutationReorderAssortmentMediaArgs = {
  sortKeys: Array<IReorderAssortmentMediaInput>;
};


export type IMutationReorderAssortmentProductsArgs = {
  sortKeys: Array<IReorderAssortmentProductInput>;
};


export type IMutationReorderProductMediaArgs = {
  sortKeys: Array<IReorderProductMediaInput>;
};


export type IMutationRequestQuotationArgs = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  productId: Scalars['ID']['input'];
};


export type IMutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type IMutationSendEnrollmentEmailArgs = {
  email: Scalars['String']['input'];
};


export type IMutationSendVerificationEmailArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
};


export type IMutationSetBaseAssortmentArgs = {
  assortmentId: Scalars['ID']['input'];
};


export type IMutationSetOrderDeliveryProviderArgs = {
  deliveryProviderId: Scalars['ID']['input'];
  orderId: Scalars['ID']['input'];
};


export type IMutationSetOrderPaymentProviderArgs = {
  orderId: Scalars['ID']['input'];
  paymentProviderId: Scalars['ID']['input'];
};


export type IMutationSetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type IMutationSetRolesArgs = {
  roles: Array<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};


export type IMutationSetUserTagsArgs = {
  tags: Array<InputMaybe<Scalars['LowerCaseString']['input']>>;
  userId: Scalars['ID']['input'];
};


export type IMutationSetUsernameArgs = {
  userId: Scalars['ID']['input'];
  username: Scalars['String']['input'];
};


export type IMutationSignPaymentProviderForCheckoutArgs = {
  orderPaymentId?: InputMaybe<Scalars['ID']['input']>;
  transactionContext?: InputMaybe<Scalars['JSON']['input']>;
};


export type IMutationSignPaymentProviderForCredentialRegistrationArgs = {
  paymentProviderId: Scalars['ID']['input'];
  transactionContext?: InputMaybe<Scalars['JSON']['input']>;
};


export type IMutationTerminateEnrollmentArgs = {
  enrollmentId: Scalars['ID']['input'];
};


export type IMutationUnpublishProductArgs = {
  productId: Scalars['ID']['input'];
};


export type IMutationUpdateAssortmentArgs = {
  assortment: IUpdateAssortmentInput;
  assortmentId: Scalars['ID']['input'];
};


export type IMutationUpdateAssortmentMediaTextsArgs = {
  assortmentMediaId: Scalars['ID']['input'];
  texts: Array<IAssortmentMediaTextInput>;
};


export type IMutationUpdateAssortmentTextsArgs = {
  assortmentId: Scalars['ID']['input'];
  texts: Array<IAssortmentTextInput>;
};


export type IMutationUpdateCartArgs = {
  billingAddress?: InputMaybe<IAddressInput>;
  contact?: InputMaybe<IContactInput>;
  deliveryProviderId?: InputMaybe<Scalars['ID']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  paymentProviderId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationUpdateCartDeliveryPickUpArgs = {
  deliveryProviderId: Scalars['ID']['input'];
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  orderPickUpLocationId: Scalars['ID']['input'];
};


export type IMutationUpdateCartDeliveryShippingArgs = {
  address?: InputMaybe<IAddressInput>;
  deliveryProviderId: Scalars['ID']['input'];
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationUpdateCartItemArgs = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  itemId: Scalars['ID']['input'];
  quantity?: InputMaybe<Scalars['Int']['input']>;
};


export type IMutationUpdateCartPaymentGenericArgs = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  paymentProviderId: Scalars['ID']['input'];
};


export type IMutationUpdateCartPaymentInvoiceArgs = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  paymentProviderId: Scalars['ID']['input'];
};


export type IMutationUpdateCountryArgs = {
  country: IUpdateCountryInput;
  countryId: Scalars['ID']['input'];
};


export type IMutationUpdateCurrencyArgs = {
  currency: IUpdateCurrencyInput;
  currencyId: Scalars['ID']['input'];
};


export type IMutationUpdateDeliveryProviderArgs = {
  deliveryProvider: IUpdateProviderInput;
  deliveryProviderId: Scalars['ID']['input'];
};


export type IMutationUpdateEnrollmentArgs = {
  billingAddress?: InputMaybe<IAddressInput>;
  contact?: InputMaybe<IContactInput>;
  delivery?: InputMaybe<IEnrollmentDeliveryInput>;
  enrollmentId?: InputMaybe<Scalars['ID']['input']>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  payment?: InputMaybe<IEnrollmentPaymentInput>;
  plan?: InputMaybe<IEnrollmentPlanInput>;
};


export type IMutationUpdateFilterArgs = {
  filter: IUpdateFilterInput;
  filterId: Scalars['ID']['input'];
};


export type IMutationUpdateFilterTextsArgs = {
  filterId: Scalars['ID']['input'];
  filterOptionValue?: InputMaybe<Scalars['String']['input']>;
  texts: Array<IFilterTextInput>;
};


export type IMutationUpdateLanguageArgs = {
  language: IUpdateLanguageInput;
  languageId: Scalars['ID']['input'];
};


export type IMutationUpdateOrderDeliveryPickUpArgs = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderDeliveryId: Scalars['ID']['input'];
  orderPickUpLocationId: Scalars['ID']['input'];
};


export type IMutationUpdateOrderDeliveryShippingArgs = {
  address?: InputMaybe<IAddressInput>;
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderDeliveryId: Scalars['ID']['input'];
};


export type IMutationUpdateOrderPaymentGenericArgs = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderPaymentId: Scalars['ID']['input'];
};


export type IMutationUpdateOrderPaymentInvoiceArgs = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  orderPaymentId: Scalars['ID']['input'];
};


export type IMutationUpdatePaymentProviderArgs = {
  paymentProvider: IUpdateProviderInput;
  paymentProviderId: Scalars['ID']['input'];
};


export type IMutationUpdateProductArgs = {
  product: IUpdateProductInput;
  productId: Scalars['ID']['input'];
};


export type IMutationUpdateProductCommerceArgs = {
  commerce: IUpdateProductCommerceInput;
  productId: Scalars['ID']['input'];
};


export type IMutationUpdateProductMediaTextsArgs = {
  productMediaId: Scalars['ID']['input'];
  texts: Array<IProductMediaTextInput>;
};


export type IMutationUpdateProductPlanArgs = {
  plan: IUpdateProductPlanInput;
  productId: Scalars['ID']['input'];
};


export type IMutationUpdateProductReviewArgs = {
  productReview: IProductReviewInput;
  productReviewId: Scalars['ID']['input'];
};


export type IMutationUpdateProductSupplyArgs = {
  productId: Scalars['ID']['input'];
  supply: IUpdateProductSupplyInput;
};


export type IMutationUpdateProductTextsArgs = {
  productId: Scalars['ID']['input'];
  texts: Array<IProductTextInput>;
};


export type IMutationUpdateProductTokenizationArgs = {
  productId: Scalars['ID']['input'];
  tokenization: IUpdateProductTokenizationInput;
};


export type IMutationUpdateProductVariationTextsArgs = {
  productVariationId: Scalars['ID']['input'];
  productVariationOptionValue?: InputMaybe<Scalars['String']['input']>;
  texts: Array<IProductVariationTextInput>;
};


export type IMutationUpdateProductWarehousingArgs = {
  productId: Scalars['ID']['input'];
  warehousing: IUpdateProductWarehousingInput;
};


export type IMutationUpdateUserProfileArgs = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  profile?: InputMaybe<IUserProfileInput>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type IMutationUpdateWarehousingProviderArgs = {
  warehousingProvider: IUpdateProviderInput;
  warehousingProviderId: Scalars['ID']['input'];
};


export type IMutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};


export type IMutationVerifyQuotationArgs = {
  quotationContext?: InputMaybe<Scalars['JSON']['input']>;
  quotationId: Scalars['ID']['input'];
};


export type IMutationVerifyWeb3AddressArgs = {
  address: Scalars['String']['input'];
  hash: Scalars['String']['input'];
};

/** Just an order */
export type IOrder = {
  _id: Scalars['ID']['output'];
  billingAddress?: Maybe<IAddress>;
  confirmed?: Maybe<Scalars['DateTimeISO']['output']>;
  contact?: Maybe<IContact>;
  country?: Maybe<ICountry>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  currency?: Maybe<ICurrency>;
  delivery?: Maybe<IOrderDelivery>;
  discounts?: Maybe<Array<IOrderDiscount>>;
  enrollment?: Maybe<IEnrollment>;
  fullfilled?: Maybe<Scalars['DateTimeISO']['output']>;
  items?: Maybe<Array<IOrderItem>>;
  orderNumber?: Maybe<Scalars['String']['output']>;
  ordered?: Maybe<Scalars['DateTimeISO']['output']>;
  payment?: Maybe<IOrderPayment>;
  rejected?: Maybe<Scalars['DateTimeISO']['output']>;
  status?: Maybe<IOrderStatus>;
  supportedDeliveryProviders: Array<IDeliveryProvider>;
  supportedPaymentProviders: Array<IPaymentProvider>;
  total?: Maybe<IPrice>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
  user?: Maybe<IUser>;
};


/** Just an order */
export type IOrderTotalArgs = {
  category?: InputMaybe<IOrderPriceCategory>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};

export type IOrderDelivery = {
  _id: Scalars['ID']['output'];
  delivered?: Maybe<Scalars['DateTimeISO']['output']>;
  discounts?: Maybe<Array<IOrderDeliveryDiscount>>;
  fee?: Maybe<IPrice>;
  provider?: Maybe<IDeliveryProvider>;
  status?: Maybe<IOrderDeliveryStatus>;
};

export type IOrderDeliveryDiscount = IOrderDiscountable & {
  _id: Scalars['ID']['output'];
  delivery: IOrderDelivery;
  orderDiscount: IOrderDiscount;
  total: IPrice;
};

export type IOrderDeliveryPickUp = IOrderDelivery & {
  _id: Scalars['ID']['output'];
  activePickUpLocation?: Maybe<IPickUpLocation>;
  delivered?: Maybe<Scalars['DateTimeISO']['output']>;
  discounts?: Maybe<Array<IOrderDeliveryDiscount>>;
  fee?: Maybe<IPrice>;
  /** @deprecated Use DeliveryProvider.pickupLocations instead */
  pickUpLocations: Array<IPickUpLocation>;
  provider?: Maybe<IDeliveryProvider>;
  status?: Maybe<IOrderDeliveryStatus>;
};

export type IOrderDeliveryShipping = IOrderDelivery & {
  _id: Scalars['ID']['output'];
  address?: Maybe<IAddress>;
  delivered?: Maybe<Scalars['DateTimeISO']['output']>;
  discounts?: Maybe<Array<IOrderDeliveryDiscount>>;
  fee?: Maybe<IPrice>;
  provider?: Maybe<IDeliveryProvider>;
  status?: Maybe<IOrderDeliveryStatus>;
};

export enum IOrderDeliveryStatus {
  /** Delivery complete */
  Delivered = 'DELIVERED',
  /** Order is not delivered */
  Open = 'OPEN',
  /** Delivery returned */
  Returned = 'RETURNED'
}

export type IOrderDiscount = {
  _id: Scalars['ID']['output'];
  code?: Maybe<Scalars['String']['output']>;
  discounted?: Maybe<Array<IOrderDiscountable>>;
  interface?: Maybe<IDiscountInterface>;
  order: IOrder;
  total: IPrice;
  trigger: IOrderDiscountTrigger;
};


export type IOrderDiscountTotalArgs = {
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum IOrderDiscountTrigger {
  /** System triggered */
  System = 'SYSTEM',
  /** User triggered */
  User = 'USER'
}

export type IOrderDiscountable = {
  _id: Scalars['ID']['output'];
  orderDiscount: IOrderDiscount;
  total: IPrice;
};

export type IOrderGlobalDiscount = IOrderDiscountable & {
  _id: Scalars['ID']['output'];
  order: IOrder;
  orderDiscount: IOrderDiscount;
  total: IPrice;
};

export type IOrderItem = {
  _id: Scalars['ID']['output'];
  configuration?: Maybe<Array<IProductConfigurationParameter>>;
  discounts?: Maybe<Array<IOrderItemDiscount>>;
  dispatches?: Maybe<Array<IDispatch>>;
  order: IOrder;
  originalProduct: IProduct;
  product: IProduct;
  quantity: Scalars['Int']['output'];
  quotation?: Maybe<IQuotation>;
  tokens: Array<IToken>;
  total?: Maybe<IPrice>;
  unitPrice?: Maybe<IPrice>;
};


export type IOrderItemTotalArgs = {
  category?: InputMaybe<IOrderItemPriceCategory>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};


export type IOrderItemUnitPriceArgs = {
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};

export type IOrderItemDiscount = IOrderDiscountable & {
  _id: Scalars['ID']['output'];
  item: IOrderItem;
  orderDiscount: IOrderDiscount;
  total: IPrice;
};

export type IOrderItemInput = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  productId: Scalars['ID']['input'];
  quantity?: InputMaybe<Scalars['Int']['input']>;
};

export enum IOrderItemPriceCategory {
  /** Discount */
  Discount = 'DISCOUNT',
  /** Items */
  Item = 'ITEM',
  /** Tax */
  Tax = 'TAX'
}

export type IOrderPayment = {
  _id: Scalars['ID']['output'];
  discounts?: Maybe<Array<IOrderPaymentDiscount>>;
  fee?: Maybe<IPrice>;
  paid?: Maybe<Scalars['DateTimeISO']['output']>;
  provider?: Maybe<IPaymentProvider>;
  status?: Maybe<IOrderPaymentStatus>;
};

export type IOrderPaymentCard = IOrderPayment & {
  _id: Scalars['ID']['output'];
  discounts?: Maybe<Array<IOrderPaymentDiscount>>;
  fee?: Maybe<IPrice>;
  paid?: Maybe<Scalars['DateTimeISO']['output']>;
  provider?: Maybe<IPaymentProvider>;
  status?: Maybe<IOrderPaymentStatus>;
};

export type IOrderPaymentDiscount = IOrderDiscountable & {
  _id: Scalars['ID']['output'];
  orderDiscount: IOrderDiscount;
  payment: IOrderPayment;
  total: IPrice;
};

export type IOrderPaymentGeneric = IOrderPayment & {
  _id: Scalars['ID']['output'];
  discounts?: Maybe<Array<IOrderPaymentDiscount>>;
  fee?: Maybe<IPrice>;
  paid?: Maybe<Scalars['DateTimeISO']['output']>;
  provider?: Maybe<IPaymentProvider>;
  status?: Maybe<IOrderPaymentStatus>;
};

export type IOrderPaymentInvoice = IOrderPayment & {
  _id: Scalars['ID']['output'];
  discounts?: Maybe<Array<IOrderPaymentDiscount>>;
  fee?: Maybe<IPrice>;
  paid?: Maybe<Scalars['DateTimeISO']['output']>;
  provider?: Maybe<IPaymentProvider>;
  status?: Maybe<IOrderPaymentStatus>;
};

export enum IOrderPaymentStatus {
  /** Unpaid Order */
  Open = 'OPEN',
  /** Order has been paid */
  Paid = 'PAID',
  /** Order has been refunded */
  Refunded = 'REFUNDED'
}

export enum IOrderPriceCategory {
  /** Delivery Fees */
  Delivery = 'DELIVERY',
  /** Discount */
  Discounts = 'DISCOUNTS',
  /** Product Price Total */
  Items = 'ITEMS',
  /** Payment Fees */
  Payment = 'PAYMENT',
  /** Tax */
  Taxes = 'TAXES'
}

export type IOrderStatistics = {
  checkoutCount: Scalars['Int']['output'];
  checkoutRecords: Array<IOrderStatisticsRecord>;
  confirmCount: Scalars['Int']['output'];
  confirmRecords: Array<IOrderStatisticsRecord>;
  fulfillCount: Scalars['Int']['output'];
  fulfilledRecords: Array<IOrderStatisticsRecord>;
  newCount: Scalars['Int']['output'];
  newRecords: Array<IOrderStatisticsRecord>;
  rejectCount: Scalars['Int']['output'];
  rejectRecords: Array<IOrderStatisticsRecord>;
};

export type IOrderStatisticsRecord = {
  count: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  total: IPrice;
};

export enum IOrderStatus {
  /** Order has been confirmed */
  Confirmed = 'CONFIRMED',
  /** Order has been fulfilled completely (all positions in delivery) */
  Fullfilled = 'FULLFILLED',
  /** Open Order / Cart */
  Open = 'OPEN',
  /** Order has been sent but confirmation awaiting */
  Pending = 'PENDING',
  /** Order has been rejected */
  Rejected = 'REJECTED'
}

export type IPaymentCredentials = {
  _id: Scalars['ID']['output'];
  isPreferred: Scalars['Boolean']['output'];
  isValid: Scalars['Boolean']['output'];
  meta?: Maybe<Scalars['JSON']['output']>;
  paymentProvider: IPaymentProvider;
  token?: Maybe<Scalars['JSON']['output']>;
  user: IUser;
};

export type IPaymentInterface = {
  _id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type IPaymentProvider = {
  _id: Scalars['ID']['output'];
  configuration?: Maybe<Scalars['JSON']['output']>;
  configurationError?: Maybe<IPaymentProviderError>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  interface?: Maybe<IPaymentInterface>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  simulatedPrice?: Maybe<IPrice>;
  type?: Maybe<IPaymentProviderType>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


export type IPaymentProviderSimulatedPriceArgs = {
  context?: InputMaybe<Scalars['JSON']['input']>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  orderId?: InputMaybe<Scalars['ID']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum IPaymentProviderError {
  AdapterNotFound = 'ADAPTER_NOT_FOUND',
  IncompleteConfiguration = 'INCOMPLETE_CONFIGURATION',
  NotImplemented = 'NOT_IMPLEMENTED',
  WrongCredentials = 'WRONG_CREDENTIALS'
}

export enum IPaymentProviderType {
  /** Generic */
  Generic = 'GENERIC',
  /** Invoice */
  Invoice = 'INVOICE'
}

export type IPickUpLocation = {
  _id: Scalars['ID']['output'];
  address?: Maybe<IAddress>;
  geoPoint?: Maybe<IGeoPosition>;
  name: Scalars['String']['output'];
};

/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProduct = IProduct & {
  _id: Scalars['ID']['output'];
  assortmentPaths: Array<IProductAssortmentPath>;
  catalogPrice?: Maybe<IPrice>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  defaultOrderQuantity?: Maybe<Scalars['Int']['output']>;
  leveledCatalogPrices: Array<IPriceLevel>;
  media: Array<IProductMedia>;
  plan?: Maybe<IProductPlanConfiguration>;
  proxies: Array<IConfigurableOrBundleProduct>;
  published?: Maybe<Scalars['DateTimeISO']['output']>;
  reviews: Array<IProductReview>;
  reviewsCount: Scalars['Int']['output'];
  salesQuantityPerUnit?: Maybe<Scalars['String']['output']>;
  salesUnit?: Maybe<Scalars['String']['output']>;
  sequence: Scalars['Int']['output'];
  siblings: Array<IProduct>;
  simulatedPrice?: Maybe<IPrice>;
  status: IProductStatus;
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IProductTexts>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductAssortmentPathsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductCatalogPriceArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductLeveledCatalogPricesArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductMediaArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductReviewsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductReviewsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductSiblingsArgs = {
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductSimulatedPriceArgs = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Plan (Virtual Product that somebody can enroll to) */
export type IPlanProductTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IPrice = {
  amount: Scalars['Int']['output'];
  currencyCode: Scalars['String']['output'];
  isNetPrice: Scalars['Boolean']['output'];
  isTaxable: Scalars['Boolean']['output'];
};

export type IPriceLevel = {
  maxQuantity?: Maybe<Scalars['Int']['output']>;
  minQuantity: Scalars['Int']['output'];
  price: IPrice;
};

export type IPriceRange = {
  maxPrice: IPrice;
  minPrice: IPrice;
};

/** Abstract Product */
export type IProduct = {
  _id: Scalars['ID']['output'];
  assortmentPaths: Array<IProductAssortmentPath>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  media: Array<IProductMedia>;
  proxies: Array<IConfigurableOrBundleProduct>;
  published?: Maybe<Scalars['DateTimeISO']['output']>;
  reviews: Array<IProductReview>;
  reviewsCount: Scalars['Int']['output'];
  sequence: Scalars['Int']['output'];
  siblings: Array<IProduct>;
  status: IProductStatus;
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IProductTexts>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


/** Abstract Product */
export type IProductMediaArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


/** Abstract Product */
export type IProductReviewsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


/** Abstract Product */
export type IProductReviewsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


/** Abstract Product */
export type IProductSiblingsArgs = {
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** Abstract Product */
export type IProductTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IProductAssignmentVectorInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

/** Directed assortment to product paths (breadcrumbs) */
export type IProductAssortmentPath = {
  assortmentProduct: IAssortmentProduct;
  links: Array<IAssortmentPathLink>;
};

export type IProductBundleItem = {
  configuration?: Maybe<Array<IProductConfigurationParameter>>;
  product: IProduct;
  quantity: Scalars['Int']['output'];
};

export type IProductCatalogPrice = {
  amount: Scalars['Int']['output'];
  country: ICountry;
  currency: ICurrency;
  isNetPrice: Scalars['Boolean']['output'];
  isTaxable: Scalars['Boolean']['output'];
  maxQuantity?: Maybe<Scalars['Int']['output']>;
};

export type IProductConfigurationParameter = {
  key: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type IProductConfigurationParameterInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type IProductDiscount = {
  _id: Scalars['ID']['output'];
  interface?: Maybe<IDiscountInterface>;
  total: IPrice;
};

export type IProductMedia = {
  _id: Scalars['ID']['output'];
  file?: Maybe<IMedia>;
  sortKey: Scalars['Int']['output'];
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IProductMediaTexts>;
};


export type IProductMediaTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IProductMediaTextInput = {
  locale: Scalars['Locale']['input'];
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type IProductMediaTexts = {
  _id: Scalars['ID']['output'];
  locale: Scalars['Locale']['output'];
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type IProductPlanConfiguration = {
  billingInterval: IProductPlanConfigurationInterval;
  billingIntervalCount?: Maybe<Scalars['Int']['output']>;
  trialInterval?: Maybe<IProductPlanConfigurationInterval>;
  trialIntervalCount?: Maybe<Scalars['Int']['output']>;
  usageCalculationType: IProductPlanUsageCalculationType;
};

export enum IProductPlanConfigurationInterval {
  Days = 'DAYS',
  Hours = 'HOURS',
  Months = 'MONTHS',
  Weeks = 'WEEKS',
  Years = 'YEARS'
}

export enum IProductPlanUsageCalculationType {
  Licensed = 'LICENSED',
  Metered = 'METERED'
}

export type IProductReview = {
  _id: Scalars['ID']['output'];
  author: IUser;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  ownVotes: Array<IProductReviewVote>;
  product: IProduct;
  rating?: Maybe<Scalars['Int']['output']>;
  review?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
  voteCount?: Maybe<Scalars['Int']['output']>;
};


export type IProductReviewVoteCountArgs = {
  type?: InputMaybe<IProductReviewVoteType>;
};

export type IProductReviewInput = {
  rating?: InputMaybe<Scalars['Int']['input']>;
  review?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type IProductReviewVote = {
  _id: Scalars['ID']['output'];
  timestamp: Scalars['Timestamp']['output'];
  type: IProductReviewVoteType;
};

export enum IProductReviewVoteType {
  Downvote = 'DOWNVOTE',
  Report = 'REPORT',
  Upvote = 'UPVOTE'
}

/** Search result */
export type IProductSearchResult = {
  filteredProductsCount: Scalars['Int']['output'];
  filters: Array<ILoadedFilter>;
  products: Array<IProduct>;
  productsCount: Scalars['Int']['output'];
};


/** Search result */
export type IProductSearchResultProductsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export enum IProductStatus {
  /** Published */
  Active = 'ACTIVE',
  /** Deleted */
  Deleted = 'DELETED',
  /** Unpublished (hidden from catalog) */
  Draft = 'DRAFT'
}

export type IProductTextInput = {
  brand?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  labels?: InputMaybe<Array<Scalars['String']['input']>>;
  locale: Scalars['Locale']['input'];
  slug?: InputMaybe<Scalars['String']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  vendor?: InputMaybe<Scalars['String']['input']>;
};

export type IProductTexts = {
  _id: Scalars['ID']['output'];
  brand?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  labels?: Maybe<Array<Scalars['String']['output']>>;
  locale: Scalars['Locale']['output'];
  slug?: Maybe<Scalars['String']['output']>;
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  vendor?: Maybe<Scalars['String']['output']>;
};

export type IProductVariation = {
  _id: Scalars['ID']['output'];
  key?: Maybe<Scalars['String']['output']>;
  options?: Maybe<Array<IProductVariationOption>>;
  texts?: Maybe<IProductVariationTexts>;
  type?: Maybe<IProductVariationType>;
};


export type IProductVariationTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

/** Key Value Combination to Product Assignment */
export type IProductVariationAssignment = {
  _id: Scalars['ID']['output'];
  /** Assigned Product */
  product?: Maybe<IProduct>;
  /** Query string key=val&key=val ... */
  vectors?: Maybe<Array<IProductVariationAssignmentVector>>;
};

/** Key Value Combination */
export type IProductVariationAssignmentVector = {
  _id: Scalars['ID']['output'];
  option?: Maybe<IProductVariationOption>;
  variation?: Maybe<IProductVariation>;
};

export type IProductVariationOption = {
  _id: Scalars['ID']['output'];
  texts?: Maybe<IProductVariationTexts>;
  value?: Maybe<Scalars['String']['output']>;
};


export type IProductVariationOptionTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IProductVariationTextInput = {
  locale: Scalars['Locale']['input'];
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type IProductVariationTexts = {
  _id: Scalars['ID']['output'];
  locale: Scalars['Locale']['output'];
  subtitle?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export enum IProductVariationType {
  /** Color Picker */
  Color = 'COLOR',
  /** Text Answers */
  Text = 'TEXT'
}

export type IPushSubscription = {
  _id: Scalars['ID']['output'];
  endpoint: Scalars['String']['output'];
  expirationTime?: Maybe<Scalars['Timestamp']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type IQuery = {
  /** Get List of currently registered worker plugins */
  activeWorkTypes: Array<IWorkType>;
  /** Get a specific assortment by ID */
  assortment?: Maybe<IAssortment>;
  /** Get all root assortments, by default sorted by sequence (ascending) */
  assortments: Array<IAssortment>;
  /** Returns total number of assortments that match a given criteria or all if no criteria is given */
  assortmentsCount: Scalars['Int']['output'];
  /** Get all countries, by default sorted by creation date (ascending) */
  countries: Array<ICountry>;
  /** Returns total number of countries */
  countriesCount: Scalars['Int']['output'];
  /** Get a specific country by ID */
  country?: Maybe<ICountry>;
  /** Get all currencies, by default sorted by creation date (ascending) */
  currencies: Array<ICurrency>;
  /** Returns total number of currencies */
  currenciesCount: Scalars['Int']['output'];
  /** Get a specific currency by ID */
  currency?: Maybe<ICurrency>;
  /** Get all delivery interfaces filtered by type */
  deliveryInterfaces: Array<IDeliveryInterface>;
  /** Get a specific delivery provider by ID */
  deliveryProvider?: Maybe<IDeliveryProvider>;
  /** Get all delivery providers, optionally filtered by type */
  deliveryProviders: Array<IDeliveryProvider>;
  /** Returns total number of delivery providers, optionally filtered by type */
  deliveryProvidersCount: Scalars['Int']['output'];
  /** Get a specific quotation by ID */
  enrollment?: Maybe<IEnrollment>;
  /** Get all enrollments, by default sorted by creation date (ascending) */
  enrollments: Array<IEnrollment>;
  /** Returns total number of enrollments */
  enrollmentsCount: Scalars['Int']['output'];
  /** Get a specific work unit by ID */
  event?: Maybe<IEvent>;
  /** Returns aggregated report of all the events that occurred in the system */
  eventStatistics: Array<IEventStatistics>;
  /** Get all emitted events, by default sorted by creation date (desc) */
  events: Array<IEvent>;
  /** Get total count of all emitted events */
  eventsCount: Scalars['Int']['output'];
  /** Get a specific filter by ID */
  filter?: Maybe<IFilter>;
  /** Get all filters, by default sorted by creation date (ascending) */
  filters: Array<IFilter>;
  /** Returns total number of filters */
  filtersCount: Scalars['Int']['output'];
  /** User impersonating currently logged in user */
  impersonator?: Maybe<IUser>;
  /** Get a specific language */
  language?: Maybe<ILanguage>;
  /** Get all languages, by default sorted by creation date (ascending) */
  languages: Array<Maybe<ILanguage>>;
  /** Returns total number languages */
  languagesCount: Scalars['Int']['output'];
  /** Currently logged in user */
  me?: Maybe<IUser>;
  /** Get a specific single order */
  order?: Maybe<IOrder>;
  /** Returns aggregated report of all the orders that occurred in the system */
  orderStatistics: IOrderStatistics;
  /** Get all orders, by default sorted by creation date (descending) */
  orders: Array<IOrder>;
  /** Returns total number of orders */
  ordersCount: Scalars['Int']['output'];
  /** Get all payment interfaces filtered by type */
  paymentInterfaces: Array<IPaymentInterface>;
  /** Get a specific payment provider by ID */
  paymentProvider?: Maybe<IPaymentProvider>;
  /** Get all payment providers, optionally filtered by type */
  paymentProviders: Array<IPaymentProvider>;
  /** Returns total number of payment providers, optionally filtered by type */
  paymentProvidersCount: Scalars['Int']['output'];
  /** Get a specific product by id or slug */
  product?: Maybe<IProduct>;
  /** List products specified prices */
  productCatalogPrices: Array<IProductCatalogPrice>;
  /** Get a specific product review by ID */
  productReview: IProductReview;
  /** Get all product reviews, by default sorted by creation date (descending) */
  productReviews: Array<IProductReview>;
  /** Returns total number of product reviews */
  productReviewsCount: Scalars['Int']['output'];
  /**
   * Simple list of published products filtered either by tags or explicit slugs
   * If a slug is provided, limit and offset don't have any effect on the result
   * By default sorted by sequence (ascending) and published (ascending) unless a queryString is set
   */
  products: Array<IProduct>;
  /**
   * Return total number of published products filtered either by tags or explicit slugs
   * If a slug is provided
   */
  productsCount: Scalars['Int']['output'];
  /** Get a specific quotation by ID */
  quotation?: Maybe<IQuotation>;
  /** Get all quotations, by default sorted by creation date (ascending) */
  quotations: Array<IQuotation>;
  /** Returns total number of quotations */
  quotationsCount: Scalars['Int']['output'];
  /** Search assortments */
  searchAssortments: IAssortmentSearchResult;
  /** Search products */
  searchProducts: IProductSearchResult;
  /** Get shop-global data and the resolved country/language pair */
  shopInfo: IShop;
  /** Get token */
  token?: Maybe<IToken>;
  /** Get all tokens */
  tokens: Array<IToken>;
  /** Returns total tokens */
  tokensCount: Scalars['Int']['output'];
  /** Localization: Media title/subtitle of a media that is attached to a assortment */
  translatedAssortmentMediaTexts: Array<IAssortmentMediaTexts>;
  /** Localization: Meta data for assortments */
  translatedAssortmentTexts: Array<IAssortmentTexts>;
  /** Localization: Filters and Filter Options */
  translatedFilterTexts: Array<IFilterTexts>;
  /** Localization: Media title/subtitle of a media that is attached to a product */
  translatedProductMediaTexts: Array<IProductMediaTexts>;
  /** Localization: Meta data for product */
  translatedProductTexts: Array<IProductTexts>;
  /** Localization: Variations and Variation Options */
  translatedProductVariationTexts: Array<IProductVariationTexts>;
  /** Specific user data if userId provided, else returns currently logged in */
  user?: Maybe<IUser>;
  /** Get list of users, by default sorted by creation date (ascending) unless a queryString is set */
  users: Array<IUser>;
  /** Get total number of users in the system that match query */
  usersCount: Scalars['Int']['output'];
  /** Determines if a token is valid/active for reset password */
  validateResetPasswordToken: Scalars['Boolean']['output'];
  /** Determines if a token is valid/active for email verification */
  validateVerifyEmailToken: Scalars['Boolean']['output'];
  /** Get all warehousing interfaces filtered by type */
  warehousingInterfaces: Array<IWarehousingInterface>;
  /** Get a specific warehousing provider by ID */
  warehousingProvider?: Maybe<IWarehousingProvider>;
  /** Get all warehousing providers, optionally filtered by type */
  warehousingProviders: Array<IWarehousingProvider>;
  /** Returns total number of delivery providers, optionally filtered by type */
  warehousingProvidersCount: Scalars['Int']['output'];
  /** Get a specific work unit by ID */
  work?: Maybe<IWork>;
  /** Get all work from the queue, by default sorted by start date (desc), priority (desc), originalWorkId (asc) and created (asc) */
  workQueue: Array<IWork>;
  /** Return total number of workers filtered the provided arguments */
  workQueueCount: Scalars['Int']['output'];
  /** Returns aggregated report of all the worker jobs that occurred in the system */
  workStatistics: Array<IWorkStatistics>;
};


export type IQueryAssortmentArgs = {
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryAssortmentsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  includeLeaves?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  slugs?: InputMaybe<Array<Scalars['String']['input']>>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IQueryAssortmentsCountArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  includeLeaves?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  slugs?: InputMaybe<Array<Scalars['String']['input']>>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IQueryCountriesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


export type IQueryCountriesCountArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryCountryArgs = {
  countryId: Scalars['ID']['input'];
};


export type IQueryCurrenciesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


export type IQueryCurrenciesCountArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryCurrencyArgs = {
  currencyId: Scalars['ID']['input'];
};


export type IQueryDeliveryInterfacesArgs = {
  type?: InputMaybe<IDeliveryProviderType>;
};


export type IQueryDeliveryProviderArgs = {
  deliveryProviderId: Scalars['ID']['input'];
};


export type IQueryDeliveryProvidersArgs = {
  type?: InputMaybe<IDeliveryProviderType>;
};


export type IQueryDeliveryProvidersCountArgs = {
  type?: InputMaybe<IDeliveryProviderType>;
};


export type IQueryEnrollmentArgs = {
  enrollmentId: Scalars['ID']['input'];
};


export type IQueryEnrollmentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  status?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type IQueryEnrollmentsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type IQueryEventArgs = {
  eventId: Scalars['ID']['input'];
};


export type IQueryEventStatisticsArgs = {
  dateRange?: InputMaybe<IDateFilterInput>;
  types?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type IQueryEventsArgs = {
  created?: InputMaybe<IDateFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  types?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type IQueryEventsCountArgs = {
  created?: InputMaybe<IDateFilterInput>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  types?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type IQueryFilterArgs = {
  filterId?: InputMaybe<Scalars['ID']['input']>;
};


export type IQueryFiltersArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


export type IQueryFiltersCountArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryLanguageArgs = {
  languageId: Scalars['ID']['input'];
};


export type IQueryLanguagesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


export type IQueryLanguagesCountArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type IQueryOrderStatisticsArgs = {
  dateRange?: InputMaybe<IDateFilterInput>;
};


export type IQueryOrdersArgs = {
  dateRange?: InputMaybe<IDateFilterInput>;
  deliveryProviderIds?: InputMaybe<Array<Scalars['String']['input']>>;
  includeCarts?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  paymentProviderIds?: InputMaybe<Array<Scalars['String']['input']>>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  status?: InputMaybe<Array<IOrderStatus>>;
};


export type IQueryOrdersCountArgs = {
  dateRange?: InputMaybe<IDateFilterInput>;
  deliveryProviderIds?: InputMaybe<Array<Scalars['String']['input']>>;
  includeCarts?: InputMaybe<Scalars['Boolean']['input']>;
  paymentProviderIds?: InputMaybe<Array<Scalars['String']['input']>>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<IOrderStatus>>;
};


export type IQueryPaymentInterfacesArgs = {
  type?: InputMaybe<IPaymentProviderType>;
};


export type IQueryPaymentProviderArgs = {
  paymentProviderId: Scalars['ID']['input'];
};


export type IQueryPaymentProvidersArgs = {
  type?: InputMaybe<IPaymentProviderType>;
};


export type IQueryPaymentProvidersCountArgs = {
  type?: InputMaybe<IPaymentProviderType>;
};


export type IQueryProductArgs = {
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryProductCatalogPricesArgs = {
  productId: Scalars['ID']['input'];
};


export type IQueryProductReviewArgs = {
  productReviewId: Scalars['ID']['input'];
};


export type IQueryProductReviewsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


export type IQueryProductReviewsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryProductsArgs = {
  includeDrafts?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  slugs?: InputMaybe<Array<Scalars['String']['input']>>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IQueryProductsCountArgs = {
  includeDrafts?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  slugs?: InputMaybe<Array<Scalars['String']['input']>>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IQueryQuotationArgs = {
  quotationId: Scalars['ID']['input'];
};


export type IQueryQuotationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


export type IQueryQuotationsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQuerySearchAssortmentsArgs = {
  assortmentIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  orderBy?: InputMaybe<ISearchOrderBy>;
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQuerySearchProductsArgs = {
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  filterQuery?: InputMaybe<Array<IFilterQueryInput>>;
  ignoreChildAssortments?: InputMaybe<Scalars['Boolean']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  orderBy?: InputMaybe<ISearchOrderBy>;
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryTokenArgs = {
  tokenId: Scalars['ID']['input'];
};


export type IQueryTokensArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryTokensCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryTranslatedAssortmentMediaTextsArgs = {
  assortmentMediaId: Scalars['ID']['input'];
};


export type IQueryTranslatedAssortmentTextsArgs = {
  assortmentId: Scalars['ID']['input'];
};


export type IQueryTranslatedFilterTextsArgs = {
  filterId: Scalars['ID']['input'];
  filterOptionValue?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryTranslatedProductMediaTextsArgs = {
  productMediaId: Scalars['ID']['input'];
};


export type IQueryTranslatedProductTextsArgs = {
  productId: Scalars['ID']['input'];
};


export type IQueryTranslatedProductVariationTextsArgs = {
  productVariationId: Scalars['ID']['input'];
  productVariationOptionValue?: InputMaybe<Scalars['String']['input']>;
};


export type IQueryUserArgs = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type IQueryUsersArgs = {
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  includeGuests?: InputMaybe<Scalars['Boolean']['input']>;
  lastLogin?: InputMaybe<IDateFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IQueryUsersCountArgs = {
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  includeGuests?: InputMaybe<Scalars['Boolean']['input']>;
  lastLogin?: InputMaybe<IDateFilterInput>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


export type IQueryValidateResetPasswordTokenArgs = {
  token: Scalars['String']['input'];
};


export type IQueryValidateVerifyEmailTokenArgs = {
  token: Scalars['String']['input'];
};


export type IQueryWarehousingInterfacesArgs = {
  type?: InputMaybe<IWarehousingProviderType>;
};


export type IQueryWarehousingProviderArgs = {
  warehousingProviderId: Scalars['ID']['input'];
};


export type IQueryWarehousingProvidersArgs = {
  type?: InputMaybe<IWarehousingProviderType>;
};


export type IQueryWarehousingProvidersCountArgs = {
  type?: InputMaybe<IWarehousingProviderType>;
};


export type IQueryWorkArgs = {
  workId: Scalars['ID']['input'];
};


export type IQueryWorkQueueArgs = {
  created?: InputMaybe<IDateFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  status?: InputMaybe<Array<IWorkStatus>>;
  types?: InputMaybe<Array<IWorkType>>;
};


export type IQueryWorkQueueCountArgs = {
  created?: InputMaybe<IDateFilterInput>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<IWorkStatus>>;
  types?: InputMaybe<Array<IWorkType>>;
};


export type IQueryWorkStatisticsArgs = {
  dateRange?: InputMaybe<IDateFilterInput>;
  types?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Quotation */
export type IQuotation = {
  _id: Scalars['ID']['output'];
  configuration?: Maybe<Array<IProductConfigurationParameter>>;
  country?: Maybe<ICountry>;
  created: Scalars['DateTimeISO']['output'];
  currency?: Maybe<ICurrency>;
  expires?: Maybe<Scalars['DateTimeISO']['output']>;
  fullfilled?: Maybe<Scalars['DateTimeISO']['output']>;
  isExpired?: Maybe<Scalars['Boolean']['output']>;
  product: IProduct;
  quotationNumber?: Maybe<Scalars['String']['output']>;
  rejected?: Maybe<Scalars['DateTimeISO']['output']>;
  status: IQuotationStatus;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
  user: IUser;
};


/** Quotation */
export type IQuotationIsExpiredArgs = {
  referenceDate?: InputMaybe<Scalars['Timestamp']['input']>;
};

export enum IQuotationDocumentType {
  /** Other */
  Other = 'OTHER',
  /** Proposal */
  Proposal = 'PROPOSAL'
}

export enum IQuotationStatus {
  /** Quotation has been used to order the product */
  Fullfilled = 'FULLFILLED',
  /** Awaiting Offer */
  Processing = 'PROCESSING',
  /** Proposal ready */
  Proposed = 'PROPOSED',
  /** Quotation has been rejected by either party */
  Rejected = 'REJECTED',
  /** Request for Proposal */
  Requested = 'REQUESTED'
}

export type IReorderAssortmentFilterInput = {
  assortmentFilterId: Scalars['ID']['input'];
  sortKey: Scalars['Int']['input'];
};

export type IReorderAssortmentLinkInput = {
  assortmentLinkId: Scalars['ID']['input'];
  sortKey: Scalars['Int']['input'];
};

export type IReorderAssortmentMediaInput = {
  assortmentMediaId: Scalars['ID']['input'];
  sortKey: Scalars['Int']['input'];
};

export type IReorderAssortmentProductInput = {
  assortmentProductId: Scalars['ID']['input'];
  sortKey: Scalars['Int']['input'];
};

export type IReorderProductMediaInput = {
  productMediaId: Scalars['ID']['input'];
  sortKey: Scalars['Int']['input'];
};

export enum IRoleAction {
  AnswerQuotation = 'answerQuotation',
  BookmarkProduct = 'bookmarkProduct',
  BulkImport = 'bulkImport',
  ChangePassword = 'changePassword',
  CheckoutCart = 'checkoutCart',
  ConfirmMediaUpload = 'confirmMediaUpload',
  CreateCart = 'createCart',
  CreateEnrollment = 'createEnrollment',
  CreateUser = 'createUser',
  DownloadFile = 'downloadFile',
  EnrollUser = 'enrollUser',
  ForgotPassword = 'forgotPassword',
  Heartbeat = 'heartbeat',
  Impersonate = 'impersonate',
  LoginAsGuest = 'loginAsGuest',
  LoginWithPassword = 'loginWithPassword',
  LoginWithWebAuthn = 'loginWithWebAuthn',
  Logout = 'logout',
  ManageAssortments = 'manageAssortments',
  ManageBookmarks = 'manageBookmarks',
  ManageCountries = 'manageCountries',
  ManageCurrencies = 'manageCurrencies',
  ManageDeliveryProviders = 'manageDeliveryProviders',
  ManageFilters = 'manageFilters',
  ManageLanguages = 'manageLanguages',
  ManagePaymentCredentials = 'managePaymentCredentials',
  ManagePaymentProviders = 'managePaymentProviders',
  ManageProductReviews = 'manageProductReviews',
  ManageProducts = 'manageProducts',
  ManageQuotations = 'manageQuotations',
  ManageUsers = 'manageUsers',
  ManageWarehousingProviders = 'manageWarehousingProviders',
  ManageWorker = 'manageWorker',
  MarkOrderConfirmed = 'markOrderConfirmed',
  MarkOrderDelivered = 'markOrderDelivered',
  MarkOrderPaid = 'markOrderPaid',
  MarkOrderRejected = 'markOrderRejected',
  PageView = 'pageView',
  RegisterPaymentCredentials = 'registerPaymentCredentials',
  RemoveUser = 'removeUser',
  RequestQuotation = 'requestQuotation',
  ResetPassword = 'resetPassword',
  ReviewProduct = 'reviewProduct',
  Search = 'search',
  SendEmail = 'sendEmail',
  StopImpersonation = 'stopImpersonation',
  UpdateCart = 'updateCart',
  UpdateEnrollment = 'updateEnrollment',
  UpdateOrder = 'updateOrder',
  UpdateOrderDelivery = 'updateOrderDelivery',
  UpdateOrderDiscount = 'updateOrderDiscount',
  UpdateOrderItem = 'updateOrderItem',
  UpdateOrderPayment = 'updateOrderPayment',
  UpdateProductReview = 'updateProductReview',
  UpdateToken = 'updateToken',
  UpdateUser = 'updateUser',
  UpdateUsername = 'updateUsername',
  UploadTempFile = 'uploadTempFile',
  UploadUserAvatar = 'uploadUserAvatar',
  UseWebAuthn = 'useWebAuthn',
  VerifyEmail = 'verifyEmail',
  ViewAssortment = 'viewAssortment',
  ViewAssortments = 'viewAssortments',
  ViewCountries = 'viewCountries',
  ViewCountry = 'viewCountry',
  ViewCurrencies = 'viewCurrencies',
  ViewCurrency = 'viewCurrency',
  ViewDeliveryInterfaces = 'viewDeliveryInterfaces',
  ViewDeliveryProvider = 'viewDeliveryProvider',
  ViewDeliveryProviders = 'viewDeliveryProviders',
  ViewEnrollment = 'viewEnrollment',
  ViewEnrollments = 'viewEnrollments',
  ViewEvent = 'viewEvent',
  ViewEvents = 'viewEvents',
  ViewFilter = 'viewFilter',
  ViewFilters = 'viewFilters',
  ViewLanguage = 'viewLanguage',
  ViewLanguages = 'viewLanguages',
  ViewLogs = 'viewLogs',
  ViewOrder = 'viewOrder',
  ViewOrders = 'viewOrders',
  ViewPaymentInterfaces = 'viewPaymentInterfaces',
  ViewPaymentProvider = 'viewPaymentProvider',
  ViewPaymentProviders = 'viewPaymentProviders',
  ViewProduct = 'viewProduct',
  ViewProducts = 'viewProducts',
  ViewQuotation = 'viewQuotation',
  ViewQuotations = 'viewQuotations',
  ViewShopInfo = 'viewShopInfo',
  ViewStatistics = 'viewStatistics',
  ViewToken = 'viewToken',
  ViewTokens = 'viewTokens',
  ViewTranslations = 'viewTranslations',
  ViewUser = 'viewUser',
  ViewUserCount = 'viewUserCount',
  ViewUserEnrollments = 'viewUserEnrollments',
  ViewUserOrders = 'viewUserOrders',
  ViewUserPrivateInfos = 'viewUserPrivateInfos',
  ViewUserProductReviews = 'viewUserProductReviews',
  ViewUserPublicInfos = 'viewUserPublicInfos',
  ViewUserQuotations = 'viewUserQuotations',
  ViewUserRoles = 'viewUserRoles',
  ViewUserTokens = 'viewUserTokens',
  ViewUsers = 'viewUsers',
  ViewWarehousingInterfaces = 'viewWarehousingInterfaces',
  ViewWarehousingProvider = 'viewWarehousingProvider',
  ViewWarehousingProviders = 'viewWarehousingProviders',
  ViewWork = 'viewWork',
  ViewWorkQueue = 'viewWorkQueue',
  VoteProductReview = 'voteProductReview'
}

export enum ISearchOrderBy {
  Default = 'default'
}

/** Search result */
export type ISearchResult = {
  filteredProductsCount: Scalars['Int']['output'];
  filters: Array<ILoadedFilter>;
  products: Array<IProduct>;
  productsCount: Scalars['Int']['output'];
};


/** Search result */
export type ISearchResultProductsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type IShop = {
  _id: Scalars['ID']['output'];
  adminUiConfig: IAdminUiConfig;
  country?: Maybe<ICountry>;
  language?: Maybe<ILanguage>;
  userRoles: Array<Scalars['String']['output']>;
  vapidPublicKey?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

/** Simple Product */
export type ISimpleProduct = IProduct & {
  _id: Scalars['ID']['output'];
  assortmentPaths: Array<IProductAssortmentPath>;
  baseUnit?: Maybe<Scalars['String']['output']>;
  catalogPrice?: Maybe<IPrice>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  defaultOrderQuantity?: Maybe<Scalars['Int']['output']>;
  dimensions?: Maybe<IDimensions>;
  leveledCatalogPrices: Array<IPriceLevel>;
  media: Array<IProductMedia>;
  proxies: Array<IConfigurableOrBundleProduct>;
  published?: Maybe<Scalars['DateTimeISO']['output']>;
  reviews: Array<IProductReview>;
  reviewsCount: Scalars['Int']['output'];
  salesQuantityPerUnit?: Maybe<Scalars['String']['output']>;
  salesUnit?: Maybe<Scalars['String']['output']>;
  sequence: Scalars['Int']['output'];
  siblings: Array<IProduct>;
  simulatedDispatches?: Maybe<Array<IDispatch>>;
  simulatedPrice?: Maybe<IPrice>;
  simulatedStocks?: Maybe<Array<IStock>>;
  sku?: Maybe<Scalars['String']['output']>;
  status: IProductStatus;
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IProductTexts>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


/** Simple Product */
export type ISimpleProductCatalogPriceArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
};


/** Simple Product */
export type ISimpleProductLeveledCatalogPricesArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
};


/** Simple Product */
export type ISimpleProductMediaArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


/** Simple Product */
export type ISimpleProductReviewsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


/** Simple Product */
export type ISimpleProductReviewsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


/** Simple Product */
export type ISimpleProductSiblingsArgs = {
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** Simple Product */
export type ISimpleProductSimulatedDispatchesArgs = {
  deliveryProviderType?: InputMaybe<IDeliveryProviderType>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  referenceDate?: InputMaybe<Scalars['Timestamp']['input']>;
};


/** Simple Product */
export type ISimpleProductSimulatedPriceArgs = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Simple Product */
export type ISimpleProductSimulatedStocksArgs = {
  deliveryProviderType?: InputMaybe<IDeliveryProviderType>;
  referenceDate?: InputMaybe<Scalars['Timestamp']['input']>;
};


/** Simple Product */
export type ISimpleProductTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export enum ISmartContractStandard {
  Erc721 = 'ERC721',
  Erc1155 = 'ERC1155'
}

export enum ISortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type ISortOptionInput = {
  key: Scalars['String']['input'];
  value: ISortDirection;
};

export type IStock = {
  deliveryProvider?: Maybe<IDeliveryProvider>;
  quantity?: Maybe<Scalars['Int']['output']>;
  warehousingProvider?: Maybe<IWarehousingProvider>;
};

export type ISuccessResponse = {
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type IToken = {
  _id: Scalars['ID']['output'];
  /** Get an access key that you can pass along the HTTP Header "x-token-accesskey" to access the token anonymously. */
  accessKey: Scalars['String']['output'];
  chainId?: Maybe<Scalars['String']['output']>;
  contractAddress?: Maybe<Scalars['String']['output']>;
  ercMetadata?: Maybe<Scalars['JSON']['output']>;
  expiryDate?: Maybe<Scalars['DateTimeISO']['output']>;
  invalidatedDate?: Maybe<Scalars['DateTimeISO']['output']>;
  isInvalidateable: Scalars['Boolean']['output'];
  product: ITokenizedProduct;
  quantity: Scalars['Int']['output'];
  status: ITokenExportStatus;
  tokenSerialNumber?: Maybe<Scalars['String']['output']>;
  user?: Maybe<IUser>;
  walletAddress?: Maybe<Scalars['String']['output']>;
};


export type ITokenErcMetadataArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export enum ITokenExportStatus {
  Centralized = 'CENTRALIZED',
  Decentralized = 'DECENTRALIZED',
  Exporting = 'EXPORTING'
}

/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProduct = IProduct & {
  _id: Scalars['ID']['output'];
  assortmentPaths: Array<IProductAssortmentPath>;
  catalogPrice?: Maybe<IPrice>;
  contractAddress?: Maybe<Scalars['String']['output']>;
  contractConfiguration?: Maybe<IContractConfiguration>;
  contractStandard?: Maybe<ISmartContractStandard>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  leveledCatalogPrices: Array<IPriceLevel>;
  media: Array<IProductMedia>;
  proxies: Array<IConfigurableOrBundleProduct>;
  published?: Maybe<Scalars['DateTimeISO']['output']>;
  reviews: Array<IProductReview>;
  reviewsCount: Scalars['Int']['output'];
  sequence: Scalars['Int']['output'];
  siblings: Array<IProduct>;
  simulatedPrice?: Maybe<IPrice>;
  simulatedStocks?: Maybe<Array<IStock>>;
  status: IProductStatus;
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  texts?: Maybe<IProductTexts>;
  tokens: Array<IToken>;
  tokensCount: Scalars['Int']['output'];
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductAssortmentPathsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductCatalogPriceArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductLeveledCatalogPricesArgs = {
  currencyCode?: InputMaybe<Scalars['String']['input']>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductMediaArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductReviewsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductReviewsCountArgs = {
  queryString?: InputMaybe<Scalars['String']['input']>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductSiblingsArgs = {
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductSimulatedPriceArgs = {
  configuration?: InputMaybe<Array<IProductConfigurationParameterInput>>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  useNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductSimulatedStocksArgs = {
  referenceDate?: InputMaybe<Scalars['Timestamp']['input']>;
};


/** Tokenized Product (Blockchain materialized Product) */
export type ITokenizedProductTextsArgs = {
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
};

export type IUpdateAssortmentInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isRoot?: InputMaybe<Scalars['Boolean']['input']>;
  sequence?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};

export type IUpdateCountryInput = {
  defaultCurrencyCode?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isoCode: Scalars['String']['input'];
};

export type IUpdateCurrencyInput = {
  contractAddress?: InputMaybe<Scalars['String']['input']>;
  decimals?: InputMaybe<Scalars['Int']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isoCode: Scalars['String']['input'];
};

export type IUpdateFilterInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
};

export type IUpdateLanguageInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isoCode: Scalars['String']['input'];
};

export type IUpdateProductCommerceInput = {
  pricing: Array<IUpdateProductCommercePricingInput>;
};

export type IUpdateProductCommercePricingInput = {
  amount: Scalars['Int']['input'];
  countryCode: Scalars['String']['input'];
  currencyCode: Scalars['String']['input'];
  isNetPrice?: InputMaybe<Scalars['Boolean']['input']>;
  isTaxable?: InputMaybe<Scalars['Boolean']['input']>;
  maxQuantity?: InputMaybe<Scalars['Int']['input']>;
};

export type IUpdateProductInput = {
  meta?: InputMaybe<Scalars['JSON']['input']>;
  sequence?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
};

export type IUpdateProductPlanInput = {
  billingInterval: IProductPlanConfigurationInterval;
  billingIntervalCount?: InputMaybe<Scalars['Int']['input']>;
  trialInterval?: InputMaybe<IProductPlanConfigurationInterval>;
  trialIntervalCount?: InputMaybe<Scalars['Int']['input']>;
  usageCalculationType: IProductPlanUsageCalculationType;
};

export type IUpdateProductSupplyInput = {
  heightInMillimeters?: InputMaybe<Scalars['Int']['input']>;
  lengthInMillimeters?: InputMaybe<Scalars['Int']['input']>;
  weightInGram?: InputMaybe<Scalars['Int']['input']>;
  widthInMillimeters?: InputMaybe<Scalars['Int']['input']>;
};

export type IUpdateProductTokenizationInput = {
  contractAddress: Scalars['String']['input'];
  contractStandard: ISmartContractStandard;
  ercMetadataProperties?: InputMaybe<Scalars['JSON']['input']>;
  supply: Scalars['Int']['input'];
  tokenId: Scalars['String']['input'];
};

export type IUpdateProductWarehousingInput = {
  baseUnit?: InputMaybe<Scalars['String']['input']>;
  sku?: InputMaybe<Scalars['String']['input']>;
};

export type IUpdateProviderInput = {
  configuration?: InputMaybe<Array<Scalars['JSON']['input']>>;
};

export type IUser = {
  _id: Scalars['ID']['output'];
  allowedActions: Array<IRoleAction>;
  avatar?: Maybe<IMedia>;
  bookmarks: Array<IBookmark>;
  cart?: Maybe<IOrder>;
  country?: Maybe<ICountry>;
  created: Scalars['DateTimeISO']['output'];
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  emails?: Maybe<Array<IUserEmail>>;
  enrollments: Array<IEnrollment>;
  isGuest: Scalars['Boolean']['output'];
  isInitialPassword: Scalars['Boolean']['output'];
  language?: Maybe<ILanguage>;
  lastBillingAddress?: Maybe<IAddress>;
  lastContact?: Maybe<IContact>;
  lastLogin?: Maybe<IUserLoginTracker>;
  name: Scalars['String']['output'];
  orders: Array<IOrder>;
  paymentCredentials: Array<IPaymentCredentials>;
  primaryEmail?: Maybe<IUserEmail>;
  profile?: Maybe<IUserProfile>;
  pushSubscriptions: Array<IPushSubscription>;
  quotations: Array<IQuotation>;
  reviews: Array<IProductReview>;
  reviewsCount: Scalars['Int']['output'];
  roles?: Maybe<Array<Scalars['String']['output']>>;
  tags?: Maybe<Array<Scalars['LowerCaseString']['output']>>;
  tokens: Array<IToken>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
  username?: Maybe<Scalars['String']['output']>;
  web3Addresses: Array<IWeb3Address>;
  webAuthnCredentials: Array<IWebAuthnCredentials>;
};


export type IUserCartArgs = {
  orderNumber?: InputMaybe<Scalars['String']['input']>;
};


export type IUserEnrollmentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  status?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type IUserOrdersArgs = {
  includeCarts?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  status?: InputMaybe<Array<IOrderStatus>>;
};


export type IUserQuotationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};


export type IUserReviewsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
};

export type IUserEmail = {
  address: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
};

export type IUserLoginTracker = {
  countryCode?: Maybe<Scalars['String']['output']>;
  locale?: Maybe<Scalars['Locale']['output']>;
  remoteAddress?: Maybe<Scalars['String']['output']>;
  remotePort?: Maybe<Scalars['Int']['output']>;
  timestamp: Scalars['Timestamp']['output'];
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type IUserProfile = {
  address?: Maybe<IAddress>;
  birthday?: Maybe<Scalars['Date']['output']>;
  displayName?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<Scalars['String']['output']>;
  phoneMobile?: Maybe<Scalars['String']['output']>;
};

export type IUserProfileInput = {
  address?: InputMaybe<IAddressInput>;
  birthday?: InputMaybe<Scalars['Timestamp']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  phoneMobile?: InputMaybe<Scalars['String']['input']>;
};

export type IWarehousingInterface = {
  _id: Scalars['ID']['output'];
  label?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type IWarehousingProvider = {
  _id: Scalars['ID']['output'];
  configuration?: Maybe<Scalars['JSON']['output']>;
  configurationError?: Maybe<IWarehousingProviderError>;
  created?: Maybe<Scalars['DateTimeISO']['output']>;
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  interface?: Maybe<IWarehousingInterface>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  type?: Maybe<IWarehousingProviderType>;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
};

export enum IWarehousingProviderError {
  AdapterNotFound = 'ADAPTER_NOT_FOUND',
  IncompleteConfiguration = 'INCOMPLETE_CONFIGURATION',
  NotImplemented = 'NOT_IMPLEMENTED',
  WrongCredentials = 'WRONG_CREDENTIALS'
}

export enum IWarehousingProviderType {
  /** Physical warehousing providers resemble stores or facilities that hold a quantity of stocks physically in stock. */
  Physical = 'PHYSICAL',
  /** Virtual warehousing providers resemble software that control ownership and validity of virtual products (for ex. smart contract bridges) */
  Virtual = 'VIRTUAL'
}

export type IWeb3Address = {
  address: Scalars['String']['output'];
  nonce?: Maybe<Scalars['Int']['output']>;
  verified: Scalars['Boolean']['output'];
};

export type IWebAuthnCredentials = {
  _id: Scalars['ID']['output'];
  aaguid: Scalars['String']['output'];
  counter: Scalars['Int']['output'];
  created: Scalars['DateTimeISO']['output'];
  mdsMetadata?: Maybe<IWebAuthnMdSv3Metadata>;
};

export type IWebAuthnMdSv3Metadata = {
  attachmentHint?: Maybe<Array<Scalars['String']['output']>>;
  attestationRootCertificates?: Maybe<Array<Scalars['String']['output']>>;
  attestationTypes?: Maybe<Array<Scalars['String']['output']>>;
  authenticationAlgorithms?: Maybe<Array<Scalars['String']['output']>>;
  authenticatorGetInfo?: Maybe<Scalars['JSON']['output']>;
  authenticatorVersion?: Maybe<Scalars['Int']['output']>;
  cryptoStrength?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  keyProtection?: Maybe<Array<Scalars['String']['output']>>;
  legalHeader?: Maybe<Scalars['String']['output']>;
  matcherProtection?: Maybe<Array<Scalars['String']['output']>>;
  protocolFamily?: Maybe<Scalars['String']['output']>;
  publicKeyAlgAndEncodings?: Maybe<Array<Scalars['String']['output']>>;
  schema?: Maybe<Scalars['Int']['output']>;
  tcDisplay?: Maybe<Array<Scalars['JSON']['output']>>;
  upv?: Maybe<Array<Scalars['JSON']['output']>>;
  userVerificationDetails?: Maybe<Array<Scalars['JSON']['output']>>;
};

export type IWork = {
  _id: Scalars['ID']['output'];
  autoscheduled?: Maybe<Scalars['Boolean']['output']>;
  created: Scalars['DateTimeISO']['output'];
  deleted?: Maybe<Scalars['DateTimeISO']['output']>;
  error?: Maybe<Scalars['JSON']['output']>;
  finished?: Maybe<Scalars['DateTimeISO']['output']>;
  input?: Maybe<Scalars['JSON']['output']>;
  original?: Maybe<IWork>;
  priority: Scalars['Int']['output'];
  result?: Maybe<Scalars['JSON']['output']>;
  retries: Scalars['Int']['output'];
  scheduled?: Maybe<Scalars['DateTimeISO']['output']>;
  started?: Maybe<Scalars['DateTimeISO']['output']>;
  status: IWorkStatus;
  success?: Maybe<Scalars['Boolean']['output']>;
  timeout?: Maybe<Scalars['Int']['output']>;
  type: IWorkType;
  updated?: Maybe<Scalars['DateTimeISO']['output']>;
  worker?: Maybe<Scalars['String']['output']>;
};

export type IWorkOutput = {
  error?: Maybe<Scalars['JSON']['output']>;
  result?: Maybe<Scalars['JSON']['output']>;
  success: Scalars['Boolean']['output'];
};

export type IWorkStatistics = {
  deleteCount: Scalars['Int']['output'];
  errorCount: Scalars['Int']['output'];
  newCount: Scalars['Int']['output'];
  startCount: Scalars['Int']['output'];
  successCount: Scalars['Int']['output'];
  type: IWorkType;
};

export enum IWorkStatus {
  Allocated = 'ALLOCATED',
  Deleted = 'DELETED',
  Failed = 'FAILED',
  New = 'NEW',
  Success = 'SUCCESS'
}

export enum IWorkType {
  Budgetsms = 'BUDGETSMS',
  Bulkgate = 'BULKGATE',
  BulkImport = 'BULK_IMPORT',
  Email = 'EMAIL',
  EnrollmentOrderGenerator = 'ENROLLMENT_ORDER_GENERATOR',
  ErrorNotifications = 'ERROR_NOTIFICATIONS',
  ExportToken = 'EXPORT_TOKEN',
  External = 'EXTERNAL',
  Heartbeat = 'HEARTBEAT',
  HttpRequest = 'HTTP_REQUEST',
  Message = 'MESSAGE',
  Push = 'PUSH',
  Twilio = 'TWILIO',
  Unknown = 'UNKNOWN',
  UpdateCoinbaseRates = 'UPDATE_COINBASE_RATES',
  UpdateEcbRates = 'UPDATE_ECB_RATES',
  ZombieKiller = 'ZOMBIE_KILLER'
}

/** One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string. */
export type I__EnumValue = {
  name: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  isDeprecated: Scalars['Boolean']['output'];
  deprecationReason?: Maybe<Scalars['String']['output']>;
};

/** Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type. */
export type I__Field = {
  name: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  args: Array<I__InputValue>;
  type: I__Type;
  isDeprecated: Scalars['Boolean']['output'];
  deprecationReason?: Maybe<Scalars['String']['output']>;
};


/** Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type. */
export type I__FieldArgsArgs = {
  includeDeprecated?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value. */
export type I__InputValue = {
  name: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  type: I__Type;
  /** A GraphQL-formatted string representing the default value for this input value. */
  defaultValue?: Maybe<Scalars['String']['output']>;
  isDeprecated: Scalars['Boolean']['output'];
  deprecationReason?: Maybe<Scalars['String']['output']>;
};

/**
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.
 *
 * Depending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.
 */
export type I__Type = {
  kind: I__TypeKind;
  name?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  specifiedByURL?: Maybe<Scalars['String']['output']>;
  fields?: Maybe<Array<I__Field>>;
  interfaces?: Maybe<Array<I__Type>>;
  possibleTypes?: Maybe<Array<I__Type>>;
  enumValues?: Maybe<Array<I__EnumValue>>;
  inputFields?: Maybe<Array<I__InputValue>>;
  ofType?: Maybe<I__Type>;
  isOneOf?: Maybe<Scalars['Boolean']['output']>;
};


/**
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.
 *
 * Depending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.
 */
export type I__TypeFieldsArgs = {
  includeDeprecated?: InputMaybe<Scalars['Boolean']['input']>;
};


/**
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.
 *
 * Depending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.
 */
export type I__TypeEnumValuesArgs = {
  includeDeprecated?: InputMaybe<Scalars['Boolean']['input']>;
};


/**
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.
 *
 * Depending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.
 */
export type I__TypeInputFieldsArgs = {
  includeDeprecated?: InputMaybe<Scalars['Boolean']['input']>;
};

/** An enum describing what kind of type a given `__Type` is. */
export enum I__TypeKind {
  /** Indicates this type is a scalar. */
  Scalar = 'SCALAR',
  /** Indicates this type is an object. `fields` and `interfaces` are valid fields. */
  Object = 'OBJECT',
  /** Indicates this type is an interface. `fields`, `interfaces`, and `possibleTypes` are valid fields. */
  Interface = 'INTERFACE',
  /** Indicates this type is a union. `possibleTypes` is a valid field. */
  Union = 'UNION',
  /** Indicates this type is an enum. `enumValues` is a valid field. */
  Enum = 'ENUM',
  /** Indicates this type is an input object. `inputFields` is a valid field. */
  InputObject = 'INPUT_OBJECT',
  /** Indicates this type is a list. `ofType` is a valid field. */
  List = 'LIST',
  /** Indicates this type is a non-null. `ofType` is a valid field. */
  NonNull = 'NON_NULL'
}

export type IMd5MetaDataFragment = { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null };


export type IMd5MetaDataFragmentVariables = Exact<{ [key: string]: never; }>;

export type IUserFragment = { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> };


export type IUserFragmentVariables = Exact<{ [key: string]: never; }>;

export type ILogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type ILogoutMutation = { logout?: { success?: boolean | null } | null };

export type IAddEmailMutationVariables = Exact<{
  email: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type IAddEmailMutation = { addEmail: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IAddWeb3AddressMutationVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type IAddWeb3AddressMutation = { addWeb3Address: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IAddWebAuthnCredentialsMutationVariables = Exact<{
  credentials: Scalars['JSON']['input'];
}>;


export type IAddWebAuthnCredentialsMutation = { addWebAuthnCredentials: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IChangePasswordMutationVariables = Exact<{
  oldPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type IChangePasswordMutation = { changePassword?: { success?: boolean | null } | null };

export type ICreateUserMutationVariables = Exact<{
  username?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  plainPassword?: InputMaybe<Scalars['String']['input']>;
  profile?: InputMaybe<IUserProfileInput>;
  webAuthnPublicKeyCredentials?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type ICreateUserMutation = { createUser?: { _id: string, tokenExpires: any } | null };

export type ICreateWebAuthnCredentialCreationOptionsMutationVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type ICreateWebAuthnCredentialCreationOptionsMutation = { createWebAuthnCredentialCreationOptions?: any | null };

export type ICreateWebAuthnCredentialRequestOptionsMutationVariables = Exact<{
  username?: InputMaybe<Scalars['String']['input']>;
}>;


export type ICreateWebAuthnCredentialRequestOptionsMutation = { createWebAuthnCredentialRequestOptions?: any | null };

export type ICurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type ICurrentUserQuery = { me?: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } | null };

export type IDeleteUserMutationVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type IDeleteUserMutation = { removeUser: { _id: string } };

export type IEnrollUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
  plainPassword?: InputMaybe<Scalars['String']['input']>;
  profile: IUserProfileInput;
}>;


export type IEnrollUserMutation = { enrollUser: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IForgotPasswordMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type IForgotPasswordMutation = { forgotPassword?: { success?: boolean | null } | null };

export type ILoginWithPasswordMutationVariables = Exact<{
  username?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
}>;


export type ILoginWithPasswordMutation = { loginWithPassword?: { _id: string, tokenExpires: any, user?: { _id: string, allowedActions: Array<IRoleAction>, roles?: Array<string> | null } | null } | null };

export type ILoginWithWebAuthnMutationVariables = Exact<{
  webAuthnPublicKeyCredentials: Scalars['JSON']['input'];
}>;


export type ILoginWithWebAuthnMutation = { loginWithWebAuthn?: { _id: string, tokenExpires: any } | null };

export type IRemoveEmailMutationVariables = Exact<{
  email: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type IRemoveEmailMutation = { removeEmail: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IRemoveWeb3AddressMutationVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type IRemoveWeb3AddressMutation = { removeWeb3Address: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IRemoveWebAuthCredentialsMutationVariables = Exact<{
  credentialsId: Scalars['ID']['input'];
}>;


export type IRemoveWebAuthCredentialsMutation = { removeWebAuthnCredentials: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IResetPasswordMutationVariables = Exact<{
  newPlainPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
}>;


export type IResetPasswordMutation = { resetPassword?: { _id: string, tokenExpires: any } | null };

export type ISendVerificationEmailMutationVariables = Exact<{
  email?: InputMaybe<Scalars['String']['input']>;
}>;


export type ISendVerificationEmailMutation = { sendVerificationEmail?: { success?: boolean | null } | null };

export type ISetPasswordMutationVariables = Exact<{
  newPlainPassword: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
}>;


export type ISetPasswordMutation = { setPassword: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type ISetRolesMutationVariables = Exact<{
  roles: Array<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
}>;


export type ISetRolesMutation = { setRoles: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type ISetUserTagsMutationVariables = Exact<{
  tags: Array<InputMaybe<Scalars['LowerCaseString']['input']>>;
  userId: Scalars['ID']['input'];
}>;


export type ISetUserTagsMutation = { setUserTags: { _id: string, tags?: Array<any> | null } };

export type ISetUsernameMutationVariables = Exact<{
  username: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
}>;


export type ISetUsernameMutation = { setUsername: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IPrepareUserAvatarUploadMutationVariables = Exact<{
  mediaName: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type IPrepareUserAvatarUploadMutation = { prepareUserAvatarUpload: { _id: string, putURL: string, expires: any } };

export type IUpdateUserProfileMutationVariables = Exact<{
  profile: IUserProfileInput;
  userId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type IUpdateUserProfileMutation = { updateUserProfile: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IUserQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type IUserQuery = { user?: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } | null };

export type IUserWebAuthnCredentialsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type IUserWebAuthnCredentialsQuery = { user?: { _id: string, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }> } | null };

export type IUsersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeGuests?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  lastLogin?: InputMaybe<IDateFilterInput>;
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
}>;


export type IUsersQuery = { usersCount: number, users: Array<{ _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> }> };

export type IUsersCountQueryVariables = Exact<{
  includeGuests?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  lastLogin?: InputMaybe<IDateFilterInput>;
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type IUsersCountQuery = { usersCount: number };

export type IValidateVerifyEmailTokenQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type IValidateVerifyEmailTokenQuery = { validateVerifyEmailToken: boolean };

export type IValidateResetPasswordTokenQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type IValidateResetPasswordTokenQuery = { validateResetPasswordToken: boolean };

export type IVerifyEmailMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type IVerifyEmailMutation = { verifyEmail?: { _id: string, tokenExpires: any, user?: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } | null } | null };

export type IVerifyWeb3AddressMutationVariables = Exact<{
  address: Scalars['String']['input'];
  hash: Scalars['String']['input'];
}>;


export type IVerifyWeb3AddressMutation = { verifyWeb3Address: { _id: string, allowedActions: Array<IRoleAction>, username?: string | null, isGuest: boolean, isInitialPassword: boolean, name: string, roles?: Array<string> | null, tags?: Array<any> | null, deleted?: any | null, lastBillingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null, lastContact?: { emailAddress?: string | null, telNumber?: string | null } | null, lastLogin?: { countryCode?: string | null, locale?: any | null, remoteAddress?: string | null, remotePort?: number | null, timestamp: any, userAgent?: string | null } | null, avatar?: { _id: string, name: string, size: number, type: string, url?: string | null } | null, paymentCredentials: Array<{ _id: string, isValid: boolean, isPreferred: boolean, paymentProvider: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } }>, emails?: Array<{ verified: boolean, address: string }> | null, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, webAuthnCredentials: Array<{ _id: string, created: any, aaguid: string, counter: number, mdsMetadata?: { legalHeader?: string | null, description?: string | null, authenticatorVersion?: number | null, protocolFamily?: string | null, schema?: number | null, authenticationAlgorithms?: Array<string> | null, publicKeyAlgAndEncodings?: Array<string> | null, attestationTypes?: Array<string> | null, keyProtection?: Array<string> | null, upv?: Array<any> | null, tcDisplay?: Array<any> | null, icon?: string | null, authenticatorGetInfo?: any | null } | null }>, profile?: { displayName?: string | null, phoneMobile?: string | null, gender?: string | null, birthday?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, addressLine2?: string | null, postalCode?: string | null, countryCode?: string | null, regionCode?: string | null, city?: string | null } | null } | null, primaryEmail?: { verified: boolean, address: string } | null, cart?: { _id: string, items?: Array<{ _id: string }> | null } | null, orders: Array<{ _id: string, items?: Array<{ _id: string }> | null }> } };

export type IAssortmentChildrenFragment = { _id: string, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null } | null };


export type IAssortmentChildrenFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAssortmentFragment = { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> };


export type IAssortmentFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAssortmentLinkFragment = { _id: string, sortKey: number, parent: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }, child: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> } };


export type IAssortmentLinkFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAssortmentMediaFragment = { _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null };


export type IAssortmentMediaFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAssortmentMediaTextsFragment = { _id: string, locale: any, title?: string | null, subtitle?: string | null };


export type IAssortmentMediaTextsFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAssortmentTextsFragment = { _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null };


export type IAssortmentTextsFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAddAssortmentFilterMutationVariables = Exact<{
  assortmentId: Scalars['ID']['input'];
  filterId: Scalars['ID']['input'];
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
}>;


export type IAddAssortmentFilterMutation = { addAssortmentFilter: { _id: string } };

export type IAddAssortmentLinkMutationVariables = Exact<{
  parentAssortmentId: Scalars['ID']['input'];
  childAssortmentId: Scalars['ID']['input'];
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
}>;


export type IAddAssortmentLinkMutation = { addAssortmentLink: { _id: string, sortKey: number, parent: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }, child: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> } } };

export type IPrepareAssortmentMediaUploadMutationVariables = Exact<{
  mediaName: Scalars['String']['input'];
  assortmentId: Scalars['ID']['input'];
}>;


export type IPrepareAssortmentMediaUploadMutation = { prepareAssortmentMediaUpload: { _id: string, putURL: string, expires: any } };

export type IAddAssortmentProductMutationVariables = Exact<{
  assortmentId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
}>;


export type IAddAssortmentProductMutation = { addAssortmentProduct: { _id: string } };

export type IAssortmentQueryVariables = Exact<{
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IAssortmentQuery = { assortment?: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> } | null };

export type IAssortmentChildrenQueryVariables = Exact<{
  slugs?: InputMaybe<Array<Scalars['String']['input']>>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  includeLeaves?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type IAssortmentChildrenQuery = { assortments: Array<{ _id: string, childrenCount: number, children?: Array<{ _id: string, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null } | null }> | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null } | null }> };

export type IAssortmentFiltersQueryVariables = Exact<{
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IAssortmentFiltersQuery = { assortment?: { _id: string, filterAssignments?: Array<{ _id: string, sortKey: number, tags?: Array<any> | null, filter: { _id: string, updated?: any | null, created?: any | null, key?: string | null, isActive?: boolean | null, type?: IFilterType | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null }> | null } }> | null } | null };

export type IAssortmentLinksQueryVariables = Exact<{
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IAssortmentLinksQuery = { assortment?: { _id: string, linkedAssortments?: Array<{ _id: string, sortKey: number, parent: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }, child: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> } }> | null } | null };

export type IAssortmentMediaQueryVariables = Exact<{
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IAssortmentMediaQuery = { assortment?: { _id: string, media: Array<{ _id: string, tags?: Array<any> | null, sortKey: number, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null, file?: { _id: string, url?: string | null, name: string, size: number, type: string } | null }> } | null };

export type IAssortmentPathsQueryVariables = Exact<{
  assortmentId: Scalars['ID']['input'];
}>;


export type IAssortmentPathsQuery = { assortment?: { assortmentPaths: Array<{ links: Array<{ assortmentId: string }> }> } | null };

export type IAssortmentProductsQueryVariables = Exact<{
  assortmentId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IAssortmentProductsQuery = { assortment?: { _id: string, productAssignments?: Array<{ _id: string, sortKey: number, tags?: Array<any> | null, product:
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, proxies: Array<
            | { __typename: 'BundleProduct' }
            | { __typename: 'ConfigurableProduct' }
          >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
            | { __typename: 'BundleProduct' }
            | { __typename: 'ConfigurableProduct' }
          >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
            | { __typename: 'BundleProduct' }
            | { __typename: 'ConfigurableProduct' }
          >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
       }> | null } | null };

export type IAssortmentsQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
  slugs?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  includeLeaves?: InputMaybe<Scalars['Boolean']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type IAssortmentsQuery = { assortmentsCount: number, assortments: Array<{ _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, linkedAssortments?: Array<{ child: { _id: string } }> | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }> };

export type IAssortmentsCountQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  includeLeaves?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type IAssortmentsCountQuery = { assortmentsCount: number };

export type ICreateAssortmentMutationVariables = Exact<{
  assortment: ICreateAssortmentInput;
  texts?: InputMaybe<Array<IAssortmentTextInput>>;
}>;


export type ICreateAssortmentMutation = { createAssortment: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> } };

export type IRemoveAssortmentMutationVariables = Exact<{
  assortmentId: Scalars['ID']['input'];
}>;


export type IRemoveAssortmentMutation = { removeAssortment: { _id: string } };

export type IRemoveAssortmentFilterMutationVariables = Exact<{
  assortmentFilterId: Scalars['ID']['input'];
}>;


export type IRemoveAssortmentFilterMutation = { removeAssortmentFilter: { _id: string } };

export type IRemoveAssortmentLinkMutationVariables = Exact<{
  assortmentLinkId: Scalars['ID']['input'];
}>;


export type IRemoveAssortmentLinkMutation = { removeAssortmentLink: { _id: string, sortKey: number, parent: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }, child: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> } } };

export type IRemoveAssortmentMediaMutationVariables = Exact<{
  assortmentMediaId: Scalars['ID']['input'];
}>;


export type IRemoveAssortmentMediaMutation = { removeAssortmentMedia: { _id: string } };

export type IRemoveAssortmentProductMutationVariables = Exact<{
  assortmentProductId: Scalars['ID']['input'];
}>;


export type IRemoveAssortmentProductMutation = { removeAssortmentProduct: { _id: string } };

export type IReorderAssortmentFiltersMutationVariables = Exact<{
  sortKeys: Array<IReorderAssortmentFilterInput>;
}>;


export type IReorderAssortmentFiltersMutation = { reorderAssortmentFilters: Array<{ _id: string, sortKey: number }> };

export type IReorderAssortmentLinksMutationVariables = Exact<{
  sortKeys: Array<IReorderAssortmentLinkInput>;
}>;


export type IReorderAssortmentLinksMutation = { reorderAssortmentLinks: Array<{ _id: string, sortKey: number }> };

export type IReorderAssortmentMediaMutationVariables = Exact<{
  sortKeys: Array<IReorderAssortmentMediaInput>;
}>;


export type IReorderAssortmentMediaMutation = { reorderAssortmentMedia: Array<{ _id: string, sortKey: number }> };

export type IReorderAssortmentProductsMutationVariables = Exact<{
  sortKeys: Array<IReorderAssortmentProductInput>;
}>;


export type IReorderAssortmentProductsMutation = { reorderAssortmentProducts: Array<{ _id: string, sortKey: number }> };

export type ISetBaseAssortmentMutationVariables = Exact<{
  assortmentId: Scalars['ID']['input'];
}>;


export type ISetBaseAssortmentMutation = { setBaseAssortment: { _id: string, isBase?: boolean | null } };

export type ITranslatedAssortmentMediaTextsQueryVariables = Exact<{
  assortmentMediaId: Scalars['ID']['input'];
}>;


export type ITranslatedAssortmentMediaTextsQuery = { translatedAssortmentMediaTexts: Array<{ _id: string, locale: any, title?: string | null, subtitle?: string | null }> };

export type ITranslatedAssortmentTextsQueryVariables = Exact<{
  assortmentId: Scalars['ID']['input'];
}>;


export type ITranslatedAssortmentTextsQuery = { translatedAssortmentTexts: Array<{ _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null }> };

export type IUpdateAssortmentMutationVariables = Exact<{
  assortment: IUpdateAssortmentInput;
  assortmentId: Scalars['ID']['input'];
}>;


export type IUpdateAssortmentMutation = { updateAssortment: { _id: string, isActive?: boolean | null, created?: any | null, updated?: any | null, sequence: number, isBase?: boolean | null, isRoot?: boolean | null, tags?: Array<any> | null, childrenCount: number, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> } };

export type IUpdateAssortmentMediaTextsMutationVariables = Exact<{
  assortmentMediaId: Scalars['ID']['input'];
  texts: Array<IAssortmentMediaTextInput>;
}>;


export type IUpdateAssortmentMediaTextsMutation = { updateAssortmentMediaTexts: Array<{ _id: string, locale: any, title?: string | null, subtitle?: string | null }> };

export type IUpdateAssortmentTextsMutationVariables = Exact<{
  assortmentId: Scalars['ID']['input'];
  texts: Array<IAssortmentTextInput>;
}>;


export type IUpdateAssortmentTextsMutation = { updateAssortmentTexts: Array<{ _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null }> };

export type IAddressFragment = { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null };


export type IAddressFragmentVariables = Exact<{ [key: string]: never; }>;

export type IConfirmMediaUploadMutationVariables = Exact<{
  mediaUploadTicketId: Scalars['ID']['input'];
  size: Scalars['Int']['input'];
  type: Scalars['String']['input'];
}>;


export type IConfirmMediaUploadMutation = { confirmMediaUpload: { _id: string, name: string, type: string, size: number, url?: string | null } };

export type IOrderAnalyticsQueryVariables = Exact<{
  dateRange?: InputMaybe<IDateFilterInput>;
}>;


export type IOrderAnalyticsQuery = { orderStatistics: { confirmCount: number, confirmRecords: Array<{ date: string, count: number, total: { amount: number, currencyCode: string } }> } };

export type IOrdersWithItemsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  includeCarts?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type IOrdersWithItemsQuery = { orders: Array<{ _id: string, orderNumber?: string | null, status?: IOrderStatus | null, created?: any | null, updated?: any | null, ordered?: any | null, confirmed?: any | null, fullfilled?: any | null, totalTax?: { amount: number, currencyCode: string } | null, itemsTotal?: { amount: number, currencyCode: string } | null, totalDiscount?: { amount: number, currencyCode: string } | null, totalPayment?: { amount: number, currencyCode: string } | null, totalDelivery?: { amount: number, currencyCode: string } | null, user?: { _id: string, username?: string | null, isGuest: boolean, avatar?: { _id: string, url?: string | null } | null, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null } | null, discounts?: Array<{ _id: string, trigger: IOrderDiscountTrigger, code?: string | null, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean }, discounted?: Array<
        | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
        | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
        | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
        | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
      > | null }> | null, payment?:
      | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
      | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
      | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
     | null, contact?: { telNumber?: string | null, emailAddress?: string | null } | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null } | null, currency?: { _id: string, isoCode: string, isActive?: boolean | null } | null, billingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null, delivery?:
      | { _id: string, status?: IOrderDeliveryStatus | null, delivered?: any | null, activePickUpLocation?: { _id: string, name: string, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null } | null, provider?:
          | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
          | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
         | null, fee?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, discounts?: Array<{ _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string }, discounted?: Array<
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            > | null } }> | null }
      | { _id: string, status?: IOrderDeliveryStatus | null, delivered?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null, provider?:
          | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
          | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
         | null, fee?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, discounts?: Array<{ _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string }, discounted?: Array<
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            > | null } }> | null }
     | null, total?: { isTaxable: boolean, amount: number, currencyCode: string } | null, items?: Array<{ _id: string, quantity: number, product:
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      , unitPrice?: { amount: number, isTaxable: boolean, isNetPrice: boolean, currencyCode: string } | null, total?: { amount: number, isTaxable: boolean, isNetPrice: boolean, currencyCode: string } | null }> | null }> };

export type IShopStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type IShopStatusQuery = { countriesCount: number, currenciesCount: number, languagesCount: number, productsCount: number, assortmentsCount: number, filtersCount: number, deliveryProvidersCount: number, paymentProvidersCount: number };

export type IShopInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type IShopInfoQuery = { shopInfo: { _id: string, version?: string | null, language?: { _id: string, isoCode?: string | null, name?: string | null } | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null, defaultCurrency?: { _id: string, isoCode: string } | null } | null, adminUiConfig: { singleSignOnURL?: string | null, productTags: Array<string>, assortmentTags: Array<string>, userTags: Array<string>, externalLinks: Array<{ href?: string | null, title?: string | null, target?: IExternalLinkTarget | null }>, customProperties: Array<{ entityName: string, inlineFragment: string }> } } };

export type ISystemRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type ISystemRolesQuery = { shopInfo: { _id: string, userRoles: Array<string> } };

export type ICountryFragment = { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, defaultCurrency?: { _id: string, isoCode: string } | null };


export type ICountryFragmentVariables = Exact<{ [key: string]: never; }>;

export type ICountriesQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type ICountriesQuery = { countriesCount: number, countries: Array<{ _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, defaultCurrency?: { _id: string, isoCode: string } | null }> };

export type ICountryQueryVariables = Exact<{
  countryId: Scalars['ID']['input'];
}>;


export type ICountryQuery = { country?: { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, defaultCurrency?: { _id: string, isoCode: string } | null } | null };

export type ICreateCountryMutationVariables = Exact<{
  country: ICreateCountryInput;
}>;


export type ICreateCountryMutation = { createCountry: { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, defaultCurrency?: { _id: string, isoCode: string } | null } };

export type IRemoveCountryMutationVariables = Exact<{
  countryId: Scalars['ID']['input'];
}>;


export type IRemoveCountryMutation = { removeCountry: { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, defaultCurrency?: { _id: string, isoCode: string } | null } };

export type IUpdateCountryMutationVariables = Exact<{
  country: IUpdateCountryInput;
  countryId: Scalars['ID']['input'];
}>;


export type IUpdateCountryMutation = { updateCountry: { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, defaultCurrency?: { _id: string, isoCode: string } | null } };

export type ICurrencyFragment = { _id: string, isoCode: string, isActive?: boolean | null, contractAddress?: string | null, decimals?: number | null };


export type ICurrencyFragmentVariables = Exact<{ [key: string]: never; }>;

export type ICreateCurrencyMutationVariables = Exact<{
  currency: ICreateCurrencyInput;
}>;


export type ICreateCurrencyMutation = { createCurrency: { _id: string, isoCode: string, isActive?: boolean | null, contractAddress?: string | null, decimals?: number | null } };

export type ICurrenciesQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type ICurrenciesQuery = { currenciesCount: number, currencies: Array<{ _id: string, isoCode: string, isActive?: boolean | null, contractAddress?: string | null, decimals?: number | null }> };

export type ICurrencyQueryVariables = Exact<{
  currencyId: Scalars['ID']['input'];
}>;


export type ICurrencyQuery = { currency?: { _id: string, isoCode: string, isActive?: boolean | null, contractAddress?: string | null, decimals?: number | null } | null };

export type IRemoveCurrencyMutationVariables = Exact<{
  currencyId: Scalars['ID']['input'];
}>;


export type IRemoveCurrencyMutation = { removeCurrency: { _id: string, isoCode: string, isActive?: boolean | null, contractAddress?: string | null, decimals?: number | null } };

export type IUpdateCurrencyMutationVariables = Exact<{
  currency: IUpdateCurrencyInput;
  currencyId: Scalars['ID']['input'];
}>;


export type IUpdateCurrencyMutation = { updateCurrency: { _id: string, isoCode: string, isActive?: boolean | null, contractAddress?: string | null, decimals?: number | null } };

export type ICreateDeliveryProviderMutationVariables = Exact<{
  deliveryProvider: ICreateDeliveryProviderInput;
}>;


export type ICreateDeliveryProviderMutation = { createDeliveryProvider:
    | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, isActive?: boolean | null, configuration?: any | null, configurationError?: IDeliveryProviderError | null, pickUpLocations: Array<{ _id: string, name: string, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null }>, interface?: { _id: string, label?: string | null, version?: string | null } | null }
    | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, isActive?: boolean | null, configuration?: any | null, configurationError?: IDeliveryProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
   };

export type IDeliveryInterfacesQueryVariables = Exact<{
  providerType?: InputMaybe<IDeliveryProviderType>;
}>;


export type IDeliveryInterfacesQuery = { deliveryInterfaces: Array<{ _id: string, label?: string | null, value: string }> };

export type IDeliveryProviderQueryVariables = Exact<{
  deliveryProviderId: Scalars['ID']['input'];
}>;


export type IDeliveryProviderQuery = { deliveryProvider?:
    | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, isActive?: boolean | null, configuration?: any | null, configurationError?: IDeliveryProviderError | null, pickUpLocations: Array<{ _id: string, name: string, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null }>, interface?: { _id: string, label?: string | null, version?: string | null } | null }
    | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, isActive?: boolean | null, configuration?: any | null, configurationError?: IDeliveryProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
   | null };

export type IDeliveryProvidersTypeQueryVariables = Exact<{ [key: string]: never; }>;


export type IDeliveryProvidersTypeQuery = { deliveryProviderType?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IDeliveryProvidersQueryVariables = Exact<{
  type?: InputMaybe<IDeliveryProviderType>;
}>;


export type IDeliveryProvidersQuery = { deliveryProvidersCount: number, deliveryProviders: Array<
    | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, isActive?: boolean | null, configuration?: any | null, configurationError?: IDeliveryProviderError | null, pickUpLocations: Array<{ _id: string, name: string, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null }>, interface?: { _id: string, label?: string | null, version?: string | null } | null }
    | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, isActive?: boolean | null, configuration?: any | null, configurationError?: IDeliveryProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
  > };

export type IOrderDeliveryStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type IOrderDeliveryStatusQuery = { deliveryStatusType?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IRemoveDeliveryProviderMutationVariables = Exact<{
  deliveryProviderId: Scalars['ID']['input'];
}>;


export type IRemoveDeliveryProviderMutation = { removeDeliveryProvider:
    | { _id: string }
    | { _id: string }
   };

export type IUpdateDeliveryProviderMutationVariables = Exact<{
  deliveryProvider: IUpdateProviderInput;
  deliveryProviderId: Scalars['ID']['input'];
}>;


export type IUpdateDeliveryProviderMutation = { updateDeliveryProvider:
    | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, isActive?: boolean | null, configuration?: any | null, configurationError?: IDeliveryProviderError | null, pickUpLocations: Array<{ _id: string, name: string, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null }>, interface?: { _id: string, label?: string | null, version?: string | null } | null }
    | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, isActive?: boolean | null, configuration?: any | null, configurationError?: IDeliveryProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
   };

export type IEnrollmentDetailFragment = { _id: string, enrollmentNumber?: string | null, updated?: any | null, status: IEnrollmentStatus, created: any, expires?: any | null, isExpired?: boolean | null, country?: { _id: string, isoCode?: string | null } | null, billingAddress?: { addressLine?: string | null, addressLine2?: string | null, city?: string | null, company?: string | null, countryCode?: string | null, firstName?: string | null, lastName?: string | null, postalCode?: string | null, regionCode?: string | null } | null, contact?: { emailAddress?: string | null, telNumber?: string | null } | null, currency?: { _id: string, contractAddress?: string | null, decimals?: number | null, isActive?: boolean | null, isoCode: string } | null, delivery?: { provider?:
      | { _id: string, configuration?: any | null, configurationError?: IDeliveryProviderError | null, isActive?: boolean | null, type?: IDeliveryProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null, simulatedPrice?: { amount: number, currencyCode: string, isNetPrice: boolean, isTaxable: boolean } | null }
      | { _id: string, configuration?: any | null, configurationError?: IDeliveryProviderError | null, isActive?: boolean | null, type?: IDeliveryProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null, simulatedPrice?: { amount: number, currencyCode: string, isNetPrice: boolean, isTaxable: boolean } | null }
     | null } | null, payment?: { provider?: { _id: string, configuration?: any | null, configurationError?: IPaymentProviderError | null, isActive?: boolean | null, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null } | null, periods: Array<{ end: any, isTrial: boolean, start: any, order?: { _id: string } | null }>, plan: { quantity: number, configuration?: Array<{ key: string, value: string }> | null, product: { _id: string, texts?: { _id: string, title?: string | null } | null } }, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null } };


export type IEnrollmentDetailFragmentVariables = Exact<{ [key: string]: never; }>;

export type IEnrollmentFragment = { _id: string, enrollmentNumber?: string | null, updated?: any | null, status: IEnrollmentStatus, created: any, expires?: any | null, isExpired?: boolean | null, country?: { _id: string, isoCode?: string | null } | null, currency?: { _id: string, isoCode: string } | null, periods: Array<{ start: any, end: any, isTrial: boolean }>, payment?: { provider?: { _id: string } | null } | null, delivery?: { provider?:
      | { _id: string }
      | { _id: string }
     | null } | null, plan: { quantity: number, product: { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }>, texts?: { _id: string, title?: string | null } | null } }, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null } };


export type IEnrollmentFragmentVariables = Exact<{ [key: string]: never; }>;

export type IActivateEnrollmentMutationVariables = Exact<{
  enrollmentId: Scalars['ID']['input'];
}>;


export type IActivateEnrollmentMutation = { activateEnrollment: { _id: string } };

export type IEnrollmentQueryVariables = Exact<{
  enrollmentId: Scalars['ID']['input'];
}>;


export type IEnrollmentQuery = { enrollment?: { _id: string, enrollmentNumber?: string | null, updated?: any | null, status: IEnrollmentStatus, created: any, expires?: any | null, isExpired?: boolean | null, country?: { _id: string, isoCode?: string | null } | null, billingAddress?: { addressLine?: string | null, addressLine2?: string | null, city?: string | null, company?: string | null, countryCode?: string | null, firstName?: string | null, lastName?: string | null, postalCode?: string | null, regionCode?: string | null } | null, contact?: { emailAddress?: string | null, telNumber?: string | null } | null, currency?: { _id: string, contractAddress?: string | null, decimals?: number | null, isActive?: boolean | null, isoCode: string } | null, delivery?: { provider?:
        | { _id: string, configuration?: any | null, configurationError?: IDeliveryProviderError | null, isActive?: boolean | null, type?: IDeliveryProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null, simulatedPrice?: { amount: number, currencyCode: string, isNetPrice: boolean, isTaxable: boolean } | null }
        | { _id: string, configuration?: any | null, configurationError?: IDeliveryProviderError | null, isActive?: boolean | null, type?: IDeliveryProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null, simulatedPrice?: { amount: number, currencyCode: string, isNetPrice: boolean, isTaxable: boolean } | null }
       | null } | null, payment?: { provider?: { _id: string, configuration?: any | null, configurationError?: IPaymentProviderError | null, isActive?: boolean | null, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null } | null, periods: Array<{ end: any, isTrial: boolean, start: any, order?: { _id: string } | null }>, plan: { quantity: number, configuration?: Array<{ key: string, value: string }> | null, product: { _id: string, texts?: { _id: string, title?: string | null } | null } }, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null } } | null };

export type IEnrollmentStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type IEnrollmentStatusQuery = { enrollmentStatusTypes?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IEnrollmentsQueryVariables = Exact<{
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  status?: InputMaybe<Array<Scalars['String']['input']>>;
}>;


export type IEnrollmentsQuery = { enrollmentsCount: number, enrollments: Array<{ _id: string, enrollmentNumber?: string | null, updated?: any | null, status: IEnrollmentStatus, created: any, expires?: any | null, isExpired?: boolean | null, country?: { _id: string, isoCode?: string | null } | null, currency?: { _id: string, isoCode: string } | null, periods: Array<{ start: any, end: any, isTrial: boolean }>, payment?: { provider?: { _id: string } | null } | null, delivery?: { provider?:
        | { _id: string }
        | { _id: string }
       | null } | null, plan: { quantity: number, product: { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }>, texts?: { _id: string, title?: string | null } | null } }, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null } }> };

export type ISendEnrollmentEmailMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type ISendEnrollmentEmailMutation = { sendEnrollmentEmail?: { success?: boolean | null } | null };

export type ITerminateEnrollmentMutationVariables = Exact<{
  enrollmentId: Scalars['ID']['input'];
}>;


export type ITerminateEnrollmentMutation = { terminateEnrollment: { _id: string } };

export type IUserEnrollmentsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  queryString?: InputMaybe<Scalars['String']['input']>;
}>;


export type IUserEnrollmentsQuery = { user?: { _id: string, enrollments: Array<{ _id: string, enrollmentNumber?: string | null, updated?: any | null, status: IEnrollmentStatus, created: any, expires?: any | null, isExpired?: boolean | null, country?: { _id: string, isoCode?: string | null } | null, currency?: { _id: string, isoCode: string } | null, periods: Array<{ start: any, end: any, isTrial: boolean }>, payment?: { provider?: { _id: string } | null } | null, delivery?: { provider?:
          | { _id: string }
          | { _id: string }
         | null } | null, plan: { quantity: number, product: { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }>, texts?: { _id: string, title?: string | null } | null } }, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null } }> } | null };

export type IEventFragment = { _id: string, type: string, payload?: any | null, created: any };


export type IEventFragmentVariables = Exact<{ [key: string]: never; }>;

export type IEventQueryVariables = Exact<{
  eventId: Scalars['ID']['input'];
}>;


export type IEventQuery = { event?: { _id: string, type: string, payload?: any | null, created: any } | null };

export type IEventsTypeQueryVariables = Exact<{ [key: string]: never; }>;


export type IEventsTypeQuery = { eventTypes?: { options?: Array<{ value: string, label: string }> | null } | null };

export type IEventsQueryVariables = Exact<{
  types?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  created?: InputMaybe<IDateFilterInput>;
}>;


export type IEventsQuery = { eventsCount: number, events: Array<{ _id: string, type: string, payload?: any | null, created: any }> };

export type IFilterFragment = { _id: string, updated?: any | null, created?: any | null, key?: string | null, isActive?: boolean | null, type?: IFilterType | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null }> | null };


export type IFilterFragmentVariables = Exact<{ [key: string]: never; }>;

export type IFilterOptionFragment = { _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null };


export type IFilterOptionFragmentVariables = Exact<{ [key: string]: never; }>;

export type IFilterTextsFragment = { _id: string, locale: any, title?: string | null, subtitle?: string | null };


export type IFilterTextsFragmentVariables = Exact<{ [key: string]: never; }>;

export type ICreateFilterMutationVariables = Exact<{
  filter: ICreateFilterInput;
  texts: Array<IFilterTextInput>;
}>;


export type ICreateFilterMutation = { createFilter: { _id: string, updated?: any | null, created?: any | null, key?: string | null, isActive?: boolean | null, type?: IFilterType | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null }> | null } };

export type ICreateFilterOptionMutationVariables = Exact<{
  filterId: Scalars['ID']['input'];
  option: Scalars['String']['input'];
  texts?: InputMaybe<Array<IFilterTextInput>>;
}>;


export type ICreateFilterOptionMutation = { createFilterOption: { _id: string } };

export type IFilterQueryVariables = Exact<{
  filterId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type IFilterQuery = { filter?: { _id: string, updated?: any | null, created?: any | null, key?: string | null, isActive?: boolean | null, type?: IFilterType | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null }> | null } | null };

export type IFilterOptionsQueryVariables = Exact<{
  filterId?: InputMaybe<Scalars['ID']['input']>;
  forceLocale?: InputMaybe<Scalars['Locale']['input']>;
}>;


export type IFilterOptionsQuery = { filter?: { _id: string, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null }> | null } | null };

export type IFilterTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type IFilterTypesQuery = { filterTypes?: { options?: Array<{ label: string, value: string }> | null } | null };

export type IFiltersQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type IFiltersQuery = { filtersCount: number, filters: Array<{ _id: string, updated?: any | null, created?: any | null, key?: string | null, isActive?: boolean | null, type?: IFilterType | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null }> | null }> };

export type IFiltersCountQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type IFiltersCountQuery = { filtersCount: number };

export type IRemoveFilterMutationVariables = Exact<{
  filterId: Scalars['ID']['input'];
}>;


export type IRemoveFilterMutation = { removeFilter: { _id: string } };

export type IRemoveFilterOptionMutationVariables = Exact<{
  filterId: Scalars['ID']['input'];
  filterOptionValue: Scalars['String']['input'];
}>;


export type IRemoveFilterOptionMutation = { removeFilterOption: { _id: string } };

export type ITranslatedFilterTextsQueryVariables = Exact<{
  filterId: Scalars['ID']['input'];
  filterOptionValue?: InputMaybe<Scalars['String']['input']>;
}>;


export type ITranslatedFilterTextsQuery = { translatedFilterTexts: Array<{ _id: string, locale: any, title?: string | null, subtitle?: string | null }> };

export type IUpdateFilterMutationVariables = Exact<{
  filter: IUpdateFilterInput;
  filterId: Scalars['ID']['input'];
}>;


export type IUpdateFilterMutation = { updateFilter: { _id: string, updated?: any | null, created?: any | null, key?: string | null, isActive?: boolean | null, type?: IFilterType | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, locale: any } | null }> | null } };

export type IUpdateFilterTextsMutationVariables = Exact<{
  filterId: Scalars['ID']['input'];
  filterOptionValue?: InputMaybe<Scalars['String']['input']>;
  texts: Array<IFilterTextInput>;
}>;


export type IUpdateFilterTextsMutation = { updateFilterTexts: Array<{ _id: string, locale: any, title?: string | null, subtitle?: string | null }> };

export type ILanguageFragment = { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, name?: string | null };


export type ILanguageFragmentVariables = Exact<{ [key: string]: never; }>;

export type ICreateLanguageMutationVariables = Exact<{
  language: ICreateLanguageInput;
}>;


export type ICreateLanguageMutation = { createLanguage: { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, name?: string | null } };

export type ILanguageQueryVariables = Exact<{
  languageId: Scalars['ID']['input'];
}>;


export type ILanguageQuery = { language?: { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, name?: string | null } | null };

export type ILanguagesQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type ILanguagesQuery = { languagesCount: number, languages: Array<{ _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, name?: string | null } | null> };

export type IRemoveLanguageMutationVariables = Exact<{
  languageId: Scalars['ID']['input'];
}>;


export type IRemoveLanguageMutation = { removeLanguage: { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, name?: string | null } };

export type IUpdateLanguageMutationVariables = Exact<{
  language: IUpdateLanguageInput;
  languageId: Scalars['ID']['input'];
}>;


export type IUpdateLanguageMutation = { updateLanguage: { _id: string, isoCode?: string | null, isActive?: boolean | null, isBase?: boolean | null, name?: string | null } };

export type IOrderDetailFragment = { _id: string, orderNumber?: string | null, status?: IOrderStatus | null, created?: any | null, updated?: any | null, ordered?: any | null, confirmed?: any | null, fullfilled?: any | null, totalTax?: { amount: number, currencyCode: string } | null, itemsTotal?: { amount: number, currencyCode: string } | null, totalDiscount?: { amount: number, currencyCode: string } | null, totalPayment?: { amount: number, currencyCode: string } | null, totalDelivery?: { amount: number, currencyCode: string } | null, user?: { _id: string, username?: string | null, isGuest: boolean, avatar?: { _id: string, url?: string | null } | null, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null } | null, discounts?: Array<{ _id: string, trigger: IOrderDiscountTrigger, code?: string | null, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean }, discounted?: Array<
      | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
      | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
      | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
      | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
    > | null }> | null, payment?:
    | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
    | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
    | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
   | null, contact?: { telNumber?: string | null, emailAddress?: string | null } | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null } | null, currency?: { _id: string, isoCode: string, isActive?: boolean | null } | null, billingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null, delivery?:
    | { _id: string, status?: IOrderDeliveryStatus | null, delivered?: any | null, activePickUpLocation?: { _id: string, name: string, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null } | null, provider?:
        | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
        | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
       | null, fee?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, discounts?: Array<{ _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string }, discounted?: Array<
            | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
          > | null } }> | null }
    | { _id: string, status?: IOrderDeliveryStatus | null, delivered?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null, provider?:
        | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
        | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
       | null, fee?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, discounts?: Array<{ _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string }, discounted?: Array<
            | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
          > | null } }> | null }
   | null, total?: { isTaxable: boolean, amount: number, currencyCode: string } | null, items?: Array<{ _id: string, quantity: number, product:
      | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    , unitPrice?: { amount: number, isTaxable: boolean, isNetPrice: boolean, currencyCode: string } | null, total?: { amount: number, isTaxable: boolean, isNetPrice: boolean, currencyCode: string } | null }> | null };


export type IOrderDetailFragmentVariables = Exact<{ [key: string]: never; }>;

export type IOrderFragment = { _id: string, status?: IOrderStatus | null, created?: any | null, updated?: any | null, ordered?: any | null, orderNumber?: string | null, confirmed?: any | null, fullfilled?: any | null, contact?: { telNumber?: string | null, emailAddress?: string | null } | null, total?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, user?: { _id: string, username?: string | null, isGuest: boolean, avatar?: { _id: string, url?: string | null } | null, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null } | null };


export type IOrderFragmentVariables = Exact<{ [key: string]: never; }>;

export type IConfirmOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
}>;


export type IConfirmOrderMutation = { confirmOrder: { _id: string } };

export type IDeliverOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
}>;


export type IDeliverOrderMutation = { deliverOrder: { _id: string } };

export type IOrderQueryVariables = Exact<{
  orderId: Scalars['ID']['input'];
}>;


export type IOrderQuery = { order?: { _id: string, orderNumber?: string | null, status?: IOrderStatus | null, created?: any | null, updated?: any | null, ordered?: any | null, confirmed?: any | null, fullfilled?: any | null, totalTax?: { amount: number, currencyCode: string } | null, itemsTotal?: { amount: number, currencyCode: string } | null, totalDiscount?: { amount: number, currencyCode: string } | null, totalPayment?: { amount: number, currencyCode: string } | null, totalDelivery?: { amount: number, currencyCode: string } | null, user?: { _id: string, username?: string | null, isGuest: boolean, avatar?: { _id: string, url?: string | null } | null, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null } | null, discounts?: Array<{ _id: string, trigger: IOrderDiscountTrigger, code?: string | null, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean }, discounted?: Array<
        | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
        | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
        | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
        | { _id: string, orderDiscount: { _id: string, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }, total: { amount: number, currencyCode: string, isTaxable: boolean, isNetPrice: boolean } }
      > | null }> | null, payment?:
      | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
      | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
      | { _id: string, status?: IOrderPaymentStatus | null, paid?: any | null, provider?: { _id: string, type?: IPaymentProviderType | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null, fee?: { currencyCode: string, amount: number } | null }
     | null, contact?: { telNumber?: string | null, emailAddress?: string | null } | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null } | null, currency?: { _id: string, isoCode: string, isActive?: boolean | null } | null, billingAddress?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null, delivery?:
      | { _id: string, status?: IOrderDeliveryStatus | null, delivered?: any | null, activePickUpLocation?: { _id: string, name: string, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null } | null, provider?:
          | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
          | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
         | null, fee?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, discounts?: Array<{ _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string }, discounted?: Array<
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            > | null } }> | null }
      | { _id: string, status?: IOrderDeliveryStatus | null, delivered?: any | null, address?: { firstName?: string | null, lastName?: string | null, company?: string | null, addressLine?: string | null, postalCode?: string | null, city?: string | null, countryCode?: string | null, regionCode?: string | null } | null, provider?:
          | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
          | { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, type?: IDeliveryProviderType | null, configuration?: any | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }
         | null, fee?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, discounts?: Array<{ _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string }, discounted?: Array<
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
              | { _id: string, orderDiscount: { _id: string, trigger: IOrderDiscountTrigger, code?: string | null, order: { _id: string, orderNumber?: string | null }, interface?: { _id: string, label?: string | null, version?: string | null } | null, total: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } } }
            > | null } }> | null }
     | null, total?: { isTaxable: boolean, amount: number, currencyCode: string } | null, items?: Array<{ _id: string, quantity: number, product:
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, brand?: string | null, vendor?: string | null, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      , unitPrice?: { amount: number, isTaxable: boolean, isNetPrice: boolean, currencyCode: string } | null, total?: { amount: number, isTaxable: boolean, isNetPrice: boolean, currencyCode: string } | null }> | null } | null };

export type IOrderStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type IOrderStatusQuery = { orderStatusType?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IOrdersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeCarts?: InputMaybe<Scalars['Boolean']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  paymentProviderIds?: InputMaybe<Array<Scalars['String']['input']>>;
  deliveryProviderIds?: InputMaybe<Array<Scalars['String']['input']>>;
  dateRange?: InputMaybe<IDateFilterInput>;
  status?: InputMaybe<Array<IOrderStatus>>;
}>;


export type IOrdersQuery = { ordersCount: number, orders: Array<{ _id: string, status?: IOrderStatus | null, created?: any | null, updated?: any | null, ordered?: any | null, orderNumber?: string | null, confirmed?: any | null, fullfilled?: any | null, contact?: { telNumber?: string | null, emailAddress?: string | null } | null, total?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, user?: { _id: string, username?: string | null, isGuest: boolean, avatar?: { _id: string, url?: string | null } | null, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null } | null }> };

export type IPayOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
}>;


export type IPayOrderMutation = { payOrder: { _id: string } };

export type IRejectOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
}>;


export type IRejectOrderMutation = { rejectOrder: { _id: string } };

export type IRemoveOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
}>;


export type IRemoveOrderMutation = { removeOrder: { _id: string } };

export type IUserOrderQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
  includeCarts?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type IUserOrderQuery = { user?: { orders: Array<{ _id: string, status?: IOrderStatus | null, created?: any | null, updated?: any | null, ordered?: any | null, orderNumber?: string | null, confirmed?: any | null, fullfilled?: any | null, contact?: { telNumber?: string | null, emailAddress?: string | null } | null, total?: { isTaxable: boolean, isNetPrice: boolean, amount: number, currencyCode: string } | null, user?: { _id: string, username?: string | null, isGuest: boolean, avatar?: { _id: string, url?: string | null } | null, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null } | null }> } | null };

export type IPaymentProviderFragment = { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IPaymentProviderType | null, configuration?: any | null, configurationError?: IPaymentProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null };


export type IPaymentProviderFragmentVariables = Exact<{ [key: string]: never; }>;

export type ICreatePaymentProviderMutationVariables = Exact<{
  paymentProvider: ICreatePaymentProviderInput;
}>;


export type ICreatePaymentProviderMutation = { createPaymentProvider: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IPaymentProviderType | null, configuration?: any | null, configurationError?: IPaymentProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } };

export type IPaymentInterfacesQueryVariables = Exact<{
  providerType?: InputMaybe<IPaymentProviderType>;
}>;


export type IPaymentInterfacesQuery = { paymentInterfaces: Array<{ _id: string, label?: string | null, value: string }> };

export type IPaymentProviderQueryVariables = Exact<{
  paymentProviderId: Scalars['ID']['input'];
}>;


export type IPaymentProviderQuery = { paymentProvider?: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IPaymentProviderType | null, configuration?: any | null, configurationError?: IPaymentProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null };

export type IPaymentProvidersTypeQueryVariables = Exact<{ [key: string]: never; }>;


export type IPaymentProvidersTypeQuery = { paymentProviderType?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IPaymentProvidersQueryVariables = Exact<{
  type?: InputMaybe<IPaymentProviderType>;
}>;


export type IPaymentProvidersQuery = { paymentProvidersCount: number, paymentProviders: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IPaymentProviderType | null, configuration?: any | null, configurationError?: IPaymentProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }> };

export type IOrderPaymentStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type IOrderPaymentStatusQuery = { paymentStatusTypes?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IRemovePaymentProviderMutationVariables = Exact<{
  paymentProviderId: Scalars['ID']['input'];
}>;


export type IRemovePaymentProviderMutation = { removePaymentProvider: { _id: string } };

export type IUpdatePaymentProviderMutationVariables = Exact<{
  paymentProvider: IUpdateProviderInput;
  paymentProviderId: Scalars['ID']['input'];
}>;


export type IUpdatePaymentProviderMutation = { updatePaymentProvider: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IPaymentProviderType | null, configuration?: any | null, configurationError?: IPaymentProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } };

export type IProductReviewDetailFragment = { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
    | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
  , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> };


export type IProductReviewDetailFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAddProductReviewVoteMutationVariables = Exact<{
  productReviewId: Scalars['ID']['input'];
  type: IProductReviewVoteType;
  meta?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type IAddProductReviewVoteMutation = { addProductReviewVote: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> } };

export type ICreateProductReviewMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  productReview: IProductReviewInput;
}>;


export type ICreateProductReviewMutation = { createProductReview: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> } };

export type IProductReviewByProductQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type IProductReviewByProductQuery = { product?:
    | { _id: string, reviewsCount: number, reviews: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> }> }
    | { _id: string, reviewsCount: number, reviews: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> }> }
    | { _id: string, reviewsCount: number, reviews: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> }> }
    | { _id: string, reviewsCount: number, reviews: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> }> }
    | { _id: string, reviewsCount: number, reviews: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> }> }
   | null };

export type IRemoveProductReviewMutationVariables = Exact<{
  productReviewId: Scalars['ID']['input'];
}>;


export type IRemoveProductReviewMutation = { removeProductReview: { _id: string } };

export type IRemoveProductReviewVoteMutationVariables = Exact<{
  productReviewId: Scalars['ID']['input'];
  type: IProductReviewVoteType;
}>;


export type IRemoveProductReviewVoteMutation = { removeProductReviewVote: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> } };

export type IUserProductReviewsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type IUserProductReviewsQuery = { user?: { _id: string, reviewsCount: number, reviews: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, product:
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, slug?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, proxies: Array<
            | { __typename: 'BundleProduct' }
            | { __typename: 'ConfigurableProduct' }
          > }
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, slug?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, slug?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
            | { __typename: 'BundleProduct' }
            | { __typename: 'ConfigurableProduct' }
          > }
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, slug?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
            | { __typename: 'BundleProduct' }
            | { __typename: 'ConfigurableProduct' }
          > }
        | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, slug?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
      , author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> }> } | null };

export type IProductAssignmentFragment = { _id: string, vectors?: Array<{ _id: string, option?: { _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null } | null, variation?: { _id: string, key?: string | null, texts?: { _id: string, locale: any, title?: string | null } | null } | null }> | null, product?:
    | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
    | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
    | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
    | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
    | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
   | null };


export type IProductAssignmentFragmentVariables = Exact<{ [key: string]: never; }>;

type IProductBriefFragment_BundleProduct = { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, proxies: Array<
    | { __typename: 'BundleProduct' }
    | { __typename: 'ConfigurableProduct' }
  >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> };

type IProductBriefFragment_ConfigurableProduct = { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> };

type IProductBriefFragment_PlanProduct = { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
    | { __typename: 'BundleProduct' }
    | { __typename: 'ConfigurableProduct' }
  >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> };

type IProductBriefFragment_SimpleProduct = { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
    | { __typename: 'BundleProduct' }
    | { __typename: 'ConfigurableProduct' }
  >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> };

type IProductBriefFragment_TokenizedProduct = { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> };

export type IProductBriefFragment =
  | IProductBriefFragment_BundleProduct
  | IProductBriefFragment_ConfigurableProduct
  | IProductBriefFragment_PlanProduct
  | IProductBriefFragment_SimpleProduct
  | IProductBriefFragment_TokenizedProduct
;


export type IProductBriefFragmentVariables = Exact<{ [key: string]: never; }>;

export type IProductCatalogPriceFragment = { isTaxable: boolean, isNetPrice: boolean, amount: number, maxQuantity?: number | null, country: { _id: string, isoCode?: string | null, name?: string | null, flagEmoji?: string | null }, currency: { _id: string, isoCode: string, isActive?: boolean | null } };


export type IProductCatalogPriceFragmentVariables = Exact<{ [key: string]: never; }>;

type IProductDetailFragment_BundleProduct = { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
  > };

type IProductDetailFragment_ConfigurableProduct = { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
  > };

type IProductDetailFragment_PlanProduct = { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
  > };

type IProductDetailFragment_SimpleProduct = { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
  > };

type IProductDetailFragment_TokenizedProduct = { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
  > };

export type IProductDetailFragment =
  | IProductDetailFragment_BundleProduct
  | IProductDetailFragment_ConfigurableProduct
  | IProductDetailFragment_PlanProduct
  | IProductDetailFragment_SimpleProduct
  | IProductDetailFragment_TokenizedProduct
;


export type IProductDetailFragmentVariables = Exact<{ [key: string]: never; }>;

export type IProductDimensionFragment = { weight?: number | null, length?: number | null, width?: number | null, height?: number | null };


export type IProductDimensionFragmentVariables = Exact<{ [key: string]: never; }>;

export type IProductMediaFragment = { _id: string, tags?: Array<any> | null, sortKey: number, file?: { _id: string, name: string, type: string, size: number, url?: string | null } | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null };


export type IProductMediaFragmentVariables = Exact<{ [key: string]: never; }>;

export type IProductMediaTextsFragment = { _id: string, locale: any, title?: string | null, subtitle?: string | null };


export type IProductMediaTextsFragmentVariables = Exact<{ [key: string]: never; }>;

export type IProductPlanConfigurationFragment = { usageCalculationType: IProductPlanUsageCalculationType, billingInterval: IProductPlanConfigurationInterval, trialInterval?: IProductPlanConfigurationInterval | null, trialIntervalCount?: number | null, billingIntervalCount?: number | null };


export type IProductPlanConfigurationFragmentVariables = Exact<{ [key: string]: never; }>;

export type IProductTextsFragment = { _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null };


export type IProductTextsFragmentVariables = Exact<{ [key: string]: never; }>;

export type IProductVariationFragment = { _id: string, type?: IProductVariationType | null, key?: string | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null }> | null };


export type IProductVariationFragmentVariables = Exact<{ [key: string]: never; }>;

export type ITokenFragment = { _id: string, walletAddress?: string | null, status: ITokenExportStatus, quantity: number, contractAddress?: string | null, chainId?: string | null, tokenSerialNumber?: string | null, invalidatedDate?: any | null, expiryDate?: any | null, ercMetadata?: any | null, accessKey: string, isInvalidateable: boolean };


export type ITokenFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAddProductAssignmentMutationVariables = Exact<{
  proxyId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
  vectors: Array<IProductAssignmentVectorInput>;
}>;


export type IAddProductAssignmentMutation = { addProductAssignment:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   };

export type IPrepareProductMediaUploadMutationVariables = Exact<{
  mediaName: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
}>;


export type IPrepareProductMediaUploadMutation = { prepareProductMediaUpload: { _id: string, putURL: string, expires: any } };

export type ICreateProductMutationVariables = Exact<{
  product: ICreateProductInput;
  texts?: InputMaybe<Array<IProductTextInput>>;
}>;


export type ICreateProductMutation = { createProduct:
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
   };

export type ICreateProductBundleItemMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  item: ICreateProductBundleItemInput;
}>;


export type ICreateProductBundleItemMutation = { createProductBundleItem:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   };

export type ICreateProductVariationMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  variation: ICreateProductVariationInput;
  texts?: InputMaybe<Array<IProductVariationTextInput>>;
}>;


export type ICreateProductVariationMutation = { createProductVariation: { _id: string } };

export type ICreateProductVariationOptionMutationVariables = Exact<{
  productVariationId: Scalars['ID']['input'];
  option: Scalars['String']['input'];
  texts?: InputMaybe<Array<IProductVariationTextInput>>;
}>;


export type ICreateProductVariationOptionMutation = { createProductVariationOption: { _id: string } };

export type IExportTokenMutationVariables = Exact<{
  tokenId: Scalars['ID']['input'];
  quantity?: Scalars['Int']['input'];
  recipientWalletAddress: Scalars['String']['input'];
}>;


export type IExportTokenMutation = { exportToken: { _id: string, walletAddress?: string | null, status: ITokenExportStatus, quantity: number, contractAddress?: string | null, chainId?: string | null, tokenSerialNumber?: string | null, invalidatedDate?: any | null, expiryDate?: any | null, ercMetadata?: any | null, accessKey: string, isInvalidateable: boolean } };

export type IProductQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IProductQuery = { product?:
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, description?: string | null } | null, proxies: Array<
        | { __typename: 'BundleProduct' }
        | { __typename: 'ConfigurableProduct' }
      >, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, description?: string | null } | null, proxies: Array<
        | { __typename: 'BundleProduct' }
        | { __typename: 'ConfigurableProduct' }
      >, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, description?: string | null } | null, proxies: Array<
        | { __typename: 'BundleProduct' }
        | { __typename: 'ConfigurableProduct' }
      >, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, title?: string | null, subtitle?: string | null, description?: string | null } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
   | null };

export type IProductAssignmentsQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IProductAssignmentsQuery = { product?:
    | { _id: string }
    | { _id: string, texts?: { _id: string, subtitle?: string | null, slug?: string | null, title?: string | null } | null, variations?: Array<{ _id: string, key?: string | null, texts?: { _id: string, title?: string | null } | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, title?: string | null } | null }> | null }> | null, assignments: Array<{ _id: string, vectors?: Array<{ _id: string, option?: { _id: string, value?: string | null, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null } | null, variation?: { _id: string, key?: string | null, texts?: { _id: string, locale: any, title?: string | null } | null } | null }> | null, product?:
          | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
          | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
          | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
          | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
          | { _id: string, texts?: { _id: string, title?: string | null, slug?: string | null, subtitle?: string | null } | null }
         | null }> }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   | null };

export type IProductBundleItemsQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IProductBundleItemsQuery = { product?:
    | { _id: string, bundleItems?: Array<{ quantity: number, product:
          | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
          | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
         }> | null }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   | null };

export type IProductCatalogPricesQueryVariables = Exact<{
  productId: Scalars['ID']['input'];
}>;


export type IProductCatalogPricesQuery = { productCatalogPrices: Array<{ isTaxable: boolean, isNetPrice: boolean, amount: number, maxQuantity?: number | null, country: { _id: string, isoCode?: string | null, name?: string | null, flagEmoji?: string | null }, currency: { _id: string, isoCode: string, isActive?: boolean | null } }> };

export type IProductMediaQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IProductMediaQuery = { product?:
    | { _id: string, media: Array<{ _id: string, tags?: Array<any> | null, sortKey: number, file?: { _id: string, name: string, type: string, size: number, url?: string | null } | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, tags?: Array<any> | null, sortKey: number, file?: { _id: string, name: string, type: string, size: number, url?: string | null } | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, tags?: Array<any> | null, sortKey: number, file?: { _id: string, name: string, type: string, size: number, url?: string | null } | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, tags?: Array<any> | null, sortKey: number, file?: { _id: string, name: string, type: string, size: number, url?: string | null } | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null }> }
    | { _id: string, media: Array<{ _id: string, tags?: Array<any> | null, sortKey: number, file?: { _id: string, name: string, type: string, size: number, url?: string | null } | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null }> }
   | null };

export type IProductPlanQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IProductPlanQuery = { product?:
    | { _id: string }
    | { _id: string }
    | { _id: string, plan?: { usageCalculationType: IProductPlanUsageCalculationType, billingInterval: IProductPlanConfigurationInterval, trialInterval?: IProductPlanConfigurationInterval | null, trialIntervalCount?: number | null, billingIntervalCount?: number | null } | null }
    | { _id: string }
    | { _id: string }
   | null };

export type IProductPlanConfigurationOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type IProductPlanConfigurationOptionsQuery = { usageCalculationTypes?: { options?: Array<{ value: string, label?: string | null }> | null } | null, configurationIntervals?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IProductReviewsQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type IProductReviewsQuery = { productReviews: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, rating?: number | null, title?: string | null, review?: string | null, upVote?: number | null, downVote?: number | null, voteReport?: number | null, author: { _id: string, username?: string | null, name: string, isGuest: boolean, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null, avatar?: { _id: string, url?: string | null } | null }, product:
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, title?: string | null, subtitle?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
    , ownVotes: Array<{ timestamp: any, type: IProductReviewVoteType }> }> };

export type IProductSupplyQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IProductSupplyQuery = { product?:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string, dimensions?: { weight?: number | null, length?: number | null, width?: number | null, height?: number | null } | null }
    | { _id: string }
   | null };

export type IProductTokenizationQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IProductTokenizationQuery = { product?:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { contractStandard?: ISmartContractStandard | null, contractAddress?: string | null, _id: string, contractConfiguration?: { tokenId: string, supply: number } | null }
   | null };

export type IProductVariationTypeQueryVariables = Exact<{ [key: string]: never; }>;


export type IProductVariationTypeQuery = { variationTypes?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IProductVariationsQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['Locale']['input']>;
}>;


export type IProductVariationsQuery = { product?:
    | { _id: string }
    | { _id: string, variations?: Array<{ _id: string, type?: IProductVariationType | null, key?: string | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null, options?: Array<{ _id: string, value?: string | null, texts?: { _id: string, locale: any, title?: string | null, subtitle?: string | null } | null }> | null }> | null }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   | null };

export type IProductWarehousingQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type IProductWarehousingQuery = { product?:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { sku?: string | null, baseUnit?: string | null, _id: string }
    | { _id: string }
   | null };

export type IProductsQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
  slugs?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  includeDrafts?: InputMaybe<Scalars['Boolean']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type IProductsQuery = { productsCount: number, products: Array<
    | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, proxies: Array<
        | { __typename: 'BundleProduct' }
        | { __typename: 'ConfigurableProduct' }
      >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
        | { __typename: 'BundleProduct' }
        | { __typename: 'ConfigurableProduct' }
      >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, catalogPrice?: { amount: number, currencyCode: string } | null, proxies: Array<
        | { __typename: 'BundleProduct' }
        | { __typename: 'ConfigurableProduct' }
      >, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
    | { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }
  > };

export type IProductsCountQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['LowerCaseString']['input']>>;
  slugs?: InputMaybe<Array<Scalars['String']['input']>>;
  includeDrafts?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type IProductsCountQuery = { productsCount: number };

export type IPublishProductMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
}>;


export type IPublishProductMutation = { publishProduct:
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
   };

export type IReOrderProductMediaMutationVariables = Exact<{
  sortKeys: Array<IReorderProductMediaInput>;
}>;


export type IReOrderProductMediaMutation = { reorderProductMedia: Array<{ _id: string }> };

export type IRemoveBundleItemMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  index: Scalars['Int']['input'];
}>;


export type IRemoveBundleItemMutation = { removeBundleItem:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   };

export type IRemoveProductMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
}>;


export type IRemoveProductMutation = { removeProduct:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   };

export type IRemoveProductAssignmentMutationVariables = Exact<{
  proxyId: Scalars['ID']['input'];
  vectors: Array<IProductAssignmentVectorInput>;
}>;


export type IRemoveProductAssignmentMutation = { removeProductAssignment:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   };

export type IRemoveProductMediaMutationVariables = Exact<{
  productMediaId: Scalars['ID']['input'];
}>;


export type IRemoveProductMediaMutation = { removeProductMedia: { _id: string } };

export type IRemoveProductVariationMutationVariables = Exact<{
  productVariationId: Scalars['ID']['input'];
}>;


export type IRemoveProductVariationMutation = { removeProductVariation: { _id: string } };

export type IRemoveProductVariationOptionMutationVariables = Exact<{
  productVariationId: Scalars['ID']['input'];
  productVariationOptionValue: Scalars['String']['input'];
}>;


export type IRemoveProductVariationOptionMutation = { removeProductVariationOption: { _id: string } };

export type ISmartContractStandardsQueryVariables = Exact<{ [key: string]: never; }>;


export type ISmartContractStandardsQuery = { smartContractStandards?: { options?: Array<{ value: string, label: string }> | null } | null };

export type ITranslatedProductMediaTextsQueryVariables = Exact<{
  productMediaId: Scalars['ID']['input'];
}>;


export type ITranslatedProductMediaTextsQuery = { translatedProductMediaTexts: Array<{ _id: string, locale: any, title?: string | null, subtitle?: string | null }> };

export type ITranslatedProductTextsQueryVariables = Exact<{
  productId: Scalars['ID']['input'];
}>;


export type ITranslatedProductTextsQuery = { translatedProductTexts: Array<{ _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null }> };

export type IUnpublishProductMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
}>;


export type IUnpublishProductMutation = { unpublishProduct:
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
   };

export type IUpdateProductMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  product: IUpdateProductInput;
}>;


export type IUpdateProductMutation = { updateProduct?:
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
   | null };

export type IUpdateProductCommerceMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  commerce: IUpdateProductCommerceInput;
}>;


export type IUpdateProductCommerceMutation = { updateProductCommerce?:
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
    | { _id: string, sequence: number, status: IProductStatus, created?: any | null, tags?: Array<any> | null, updated?: any | null, published?: any | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }>, reviews: Array<{ _id: string, created?: any | null, rating?: number | null, title?: string | null, review?: string | null, voteCount?: number | null, author: { _id: string, username?: string | null, isGuest: boolean }, ownVotes: Array<{ type: IProductReviewVoteType, timestamp: any }> }>, siblings: Array<
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
        | { _id: string, media: Array<{ _id: string, file?: { _id: string, url?: string | null } | null }> }
      > }
   | null };

export type IUpdateProductMediaTextsMutationVariables = Exact<{
  productMediaId: Scalars['ID']['input'];
  texts: Array<IProductMediaTextInput>;
}>;


export type IUpdateProductMediaTextsMutation = { updateProductMediaTexts: Array<{ _id: string, locale: any, title?: string | null, subtitle?: string | null }> };

export type IUpdateProductPlanMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  plan: IUpdateProductPlanInput;
}>;


export type IUpdateProductPlanMutation = { updateProductPlan?:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
   | null };

export type IUpdateProductSupplyMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  supply: IUpdateProductSupplyInput;
}>;


export type IUpdateProductSupplyMutation = { updateProductSupply?:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string, dimensions?: { weight?: number | null, length?: number | null, width?: number | null, height?: number | null } | null }
    | { _id: string }
   | null };

export type IUpdateProductTextsMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  texts: Array<IProductTextInput>;
}>;


export type IUpdateProductTextsMutation = { updateProductTexts: Array<{ _id: string, locale: any, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null }> };

export type IUpdateProductTokenizationMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  tokenization: IUpdateProductTokenizationInput;
}>;


export type IUpdateProductTokenizationMutation = { updateProductTokenization?: { _id: string } | null };

export type IUpdateProductVariationTextsMutationVariables = Exact<{
  productVariationId: Scalars['ID']['input'];
  productVariationOptionValue?: InputMaybe<Scalars['String']['input']>;
  texts: Array<IProductVariationTextInput>;
}>;


export type IUpdateProductVariationTextsMutation = { updateProductVariationTexts: Array<{ _id: string }> };

export type IUpdateProductWarehousingMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  warehousing: IUpdateProductWarehousingInput;
}>;


export type IUpdateProductWarehousingMutation = { updateProductWarehousing?:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { sku?: string | null, baseUnit?: string | null, _id: string }
    | { _id: string }
   | null };

export type IUserTokensQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type IUserTokensQuery = { user?: { _id: string, web3Addresses: Array<{ address: string, nonce?: number | null, verified: boolean }>, tokens: Array<{ _id: string, walletAddress?: string | null, status: ITokenExportStatus, quantity: number, contractAddress?: string | null, chainId?: string | null, tokenSerialNumber?: string | null, invalidatedDate?: any | null, expiryDate?: any | null, ercMetadata?: any | null, accessKey: string, isInvalidateable: boolean, product: { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, simulatedPrice?: { amount: number, currencyCode: string } | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> } }> } | null };

export type IQuotationDetailFragment = { _id: string, status: IQuotationStatus, created: any, expires?: any | null, updated?: any | null, isExpired?: boolean | null, quotationNumber?: string | null, fullfilled?: any | null, rejected?: any | null, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null }, configuration?: Array<{ key: string, value: string }> | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null } | null, currency?: { _id: string, isoCode: string, isActive?: boolean | null } | null, product:
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
   };


export type IQuotationDetailFragmentVariables = Exact<{ [key: string]: never; }>;

export type IQuotationFragment = { _id: string, status: IQuotationStatus, created: any, expires?: any | null, updated?: any | null, isExpired?: boolean | null, quotationNumber?: string | null, fullfilled?: any | null, rejected?: any | null, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null }, product:
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
  , currency?: { _id: string, contractAddress?: string | null, decimals?: number | null, isoCode: string } | null };


export type IQuotationFragmentVariables = Exact<{ [key: string]: never; }>;

export type IMakeQuotationProposalMutationVariables = Exact<{
  quotationId: Scalars['ID']['input'];
  quotationContext?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type IMakeQuotationProposalMutation = { makeQuotationProposal: { _id: string, status: IQuotationStatus, created: any, expires?: any | null, updated?: any | null, isExpired?: boolean | null, quotationNumber?: string | null, fullfilled?: any | null, rejected?: any | null, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null }, configuration?: Array<{ key: string, value: string }> | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null } | null, currency?: { _id: string, isoCode: string, isActive?: boolean | null } | null, product:
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
     } };

export type IQuotationQueryVariables = Exact<{
  quotationId: Scalars['ID']['input'];
}>;


export type IQuotationQuery = { quotationsCount: number, quotation?: { _id: string, status: IQuotationStatus, created: any, expires?: any | null, updated?: any | null, isExpired?: boolean | null, quotationNumber?: string | null, fullfilled?: any | null, rejected?: any | null, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null }, configuration?: Array<{ key: string, value: string }> | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null } | null, currency?: { _id: string, isoCode: string, isActive?: boolean | null } | null, product:
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
     } | null };

export type IQuotationStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type IQuotationStatusQuery = { quotationStatusType?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IQuotationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type IQuotationsQuery = { quotationsCount: number, quotations: Array<{ _id: string, status: IQuotationStatus, created: any, expires?: any | null, updated?: any | null, isExpired?: boolean | null, quotationNumber?: string | null, fullfilled?: any | null, rejected?: any | null, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null }, product:
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
    , currency?: { _id: string, contractAddress?: string | null, decimals?: number | null, isoCode: string } | null }> };

export type IRejectQuotationMutationVariables = Exact<{
  quotationId: Scalars['ID']['input'];
  quotationContext?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type IRejectQuotationMutation = { rejectQuotation: { _id: string, status: IQuotationStatus, created: any, expires?: any | null, updated?: any | null, isExpired?: boolean | null, quotationNumber?: string | null, fullfilled?: any | null, rejected?: any | null, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null }, configuration?: Array<{ key: string, value: string }> | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null } | null, currency?: { _id: string, isoCode: string, isActive?: boolean | null } | null, product:
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
     } };

export type IUserQuotationsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  queryString?: InputMaybe<Scalars['String']['input']>;
}>;


export type IUserQuotationsQuery = { user?: { _id: string, quotations: Array<{ _id: string, status: IQuotationStatus, created: any, expires?: any | null, updated?: any | null, isExpired?: boolean | null, quotationNumber?: string | null, fullfilled?: any | null, rejected?: any | null, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null }, product:
        | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
        | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      , currency?: { _id: string, contractAddress?: string | null, decimals?: number | null, isoCode: string } | null }> } | null };

export type IVerifyQuotationMutationVariables = Exact<{
  quotationId: Scalars['ID']['input'];
  quotationContext?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type IVerifyQuotationMutation = { verifyQuotation: { _id: string, status: IQuotationStatus, created: any, expires?: any | null, updated?: any | null, isExpired?: boolean | null, quotationNumber?: string | null, fullfilled?: any | null, rejected?: any | null, user: { _id: string, username?: string | null, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null }, configuration?: Array<{ key: string, value: string }> | null, country?: { _id: string, isoCode?: string | null, flagEmoji?: string | null, name?: string | null } | null, currency?: { _id: string, isoCode: string, isActive?: boolean | null } | null, product:
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
      | { _id: string, texts?: { _id: string, slug?: string | null, subtitle?: string | null, title?: string | null, description?: string | null } | null, media: Array<{ _id: string, file?: { _id: string, type: string, url?: string | null } | null }> }
     } };

export type IInvalidateTokenMutationVariables = Exact<{
  tokenId: Scalars['ID']['input'];
}>;


export type IInvalidateTokenMutation = { invalidateToken: { _id: string, walletAddress?: string | null, status: ITokenExportStatus, quantity: number, contractAddress?: string | null, chainId?: string | null, tokenSerialNumber?: string | null, invalidatedDate?: any | null, expiryDate?: any | null, ercMetadata?: any | null, accessKey: string, isInvalidateable: boolean } };

export type ITokenQueryVariables = Exact<{
  tokenId: Scalars['ID']['input'];
}>;


export type ITokenQuery = { token?: { _id: string, walletAddress?: string | null, status: ITokenExportStatus, quantity: number, contractAddress?: string | null, chainId?: string | null, tokenSerialNumber?: string | null, invalidatedDate?: any | null, expiryDate?: any | null, ercMetadata?: any | null, accessKey: string, isInvalidateable: boolean, product: { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, simulatedPrice?: { amount: number, currencyCode: string } | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }, user?: { _id: string, username?: string | null, isGuest: boolean, name: string, avatar?: { _id: string, url?: string | null } | null, primaryEmail?: { verified: boolean, address: string } | null, lastContact?: { telNumber?: string | null, emailAddress?: string | null } | null, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null } | null } | null };

export type ITokensQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ITokensQuery = { tokensCount: number, tokens: Array<{ _id: string, walletAddress?: string | null, status: ITokenExportStatus, quantity: number, contractAddress?: string | null, chainId?: string | null, tokenSerialNumber?: string | null, invalidatedDate?: any | null, expiryDate?: any | null, ercMetadata?: any | null, accessKey: string, isInvalidateable: boolean, product: { _id: string, sequence: number, status: IProductStatus, tags?: Array<any> | null, updated?: any | null, published?: any | null, simulatedPrice?: { amount: number, currencyCode: string } | null, texts?: { _id: string, slug?: string | null, title?: string | null, subtitle?: string | null, description?: string | null, vendor?: string | null, brand?: string | null, labels?: Array<string> | null, locale: any } | null, media: Array<{ _id: string, tags?: Array<any> | null, file?: { _id: string, url?: string | null } | null }> }, user?: { _id: string, username?: string | null, isGuest: boolean, primaryEmail?: { address: string, verified: boolean } | null, avatar?: { _id: string, url?: string | null } | null, profile?: { displayName?: string | null, address?: { firstName?: string | null, lastName?: string | null } | null } | null } | null }> };

export type IWarehousingProviderFragment = { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IWarehousingProviderType | null, configuration?: any | null, configurationError?: IWarehousingProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null };


export type IWarehousingProviderFragmentVariables = Exact<{ [key: string]: never; }>;

export type ICreateWarehousingProviderMutationVariables = Exact<{
  warehousingProvider: ICreateWarehousingProviderInput;
}>;


export type ICreateWarehousingProviderMutation = { createWarehousingProvider: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IWarehousingProviderType | null, configuration?: any | null, configurationError?: IWarehousingProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } };

export type IRemoveWarehousingProviderMutationVariables = Exact<{
  warehousingProviderId: Scalars['ID']['input'];
}>;


export type IRemoveWarehousingProviderMutation = { removeWarehousingProvider: { _id: string } };

export type IUpdateWarehousingProviderMutationVariables = Exact<{
  warehousingProvider: IUpdateProviderInput;
  warehousingProviderId: Scalars['ID']['input'];
}>;


export type IUpdateWarehousingProviderMutation = { updateWarehousingProvider: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IWarehousingProviderType | null, configuration?: any | null, configurationError?: IWarehousingProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } };

export type IWarehousingInterfacesQueryVariables = Exact<{
  providerType?: InputMaybe<IWarehousingProviderType>;
}>;


export type IWarehousingInterfacesQuery = { warehousingInterfaces: Array<{ _id: string, label?: string | null, value: string }> };

export type IWarehousingProviderQueryVariables = Exact<{
  warehousingProviderId: Scalars['ID']['input'];
}>;


export type IWarehousingProviderQuery = { warehousingProvider?: { _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IWarehousingProviderType | null, configuration?: any | null, configurationError?: IWarehousingProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null } | null };

export type IWarehousingProvidersTypeQueryVariables = Exact<{ [key: string]: never; }>;


export type IWarehousingProvidersTypeQuery = { warehousingProviderType?: { options?: Array<{ value: string, label?: string | null }> | null } | null };

export type IWarehousingProvidersQueryVariables = Exact<{
  type?: InputMaybe<IWarehousingProviderType>;
}>;


export type IWarehousingProvidersQuery = { warehousingProvidersCount: number, warehousingProviders: Array<{ _id: string, created?: any | null, updated?: any | null, deleted?: any | null, isActive?: boolean | null, type?: IWarehousingProviderType | null, configuration?: any | null, configurationError?: IWarehousingProviderError | null, interface?: { _id: string, label?: string | null, version?: string | null } | null }> };

export type IWorkFragment = { _id: string, type: IWorkType, scheduled?: any | null, status: IWorkStatus, started?: any | null, success?: boolean | null, finished?: any | null, created: any, deleted?: any | null, retries: number, input?: any | null, result?: any | null, original?: { _id: string, retries: number } | null };


export type IWorkFragmentVariables = Exact<{ [key: string]: never; }>;

export type IAddWorkMutationVariables = Exact<{
  type: IWorkType;
  priority?: Scalars['Int']['input'];
  input?: InputMaybe<Scalars['JSON']['input']>;
  originalWorkId?: InputMaybe<Scalars['ID']['input']>;
  scheduled?: InputMaybe<Scalars['Timestamp']['input']>;
  retries?: Scalars['Int']['input'];
}>;


export type IAddWorkMutation = { addWork?: { _id: string } | null };

export type IAllocateWorkMutationVariables = Exact<{
  types?: InputMaybe<Array<InputMaybe<IWorkType>>>;
  worker?: InputMaybe<Scalars['String']['input']>;
}>;


export type IAllocateWorkMutation = { allocateWork?: { _id: string } | null };

export type IWorkTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type IWorkTypesQuery = { registeredWorkTypes?: { options?: Array<{ value: string, label: string }> | null } | null };

export type IRemoveWorkMutationVariables = Exact<{
  workId: Scalars['ID']['input'];
}>;


export type IRemoveWorkMutation = { removeWork: { _id: string } };

export type IWorkQueryVariables = Exact<{
  workId: Scalars['ID']['input'];
}>;


export type IWorkQuery = { work?: { error?: any | null, priority: number, worker?: string | null, timeout?: number | null, _id: string, type: IWorkType, scheduled?: any | null, status: IWorkStatus, started?: any | null, success?: boolean | null, finished?: any | null, created: any, deleted?: any | null, retries: number, input?: any | null, result?: any | null, original?: { _id: string, retries: number } | null } | null };

export type IWorkQueueQueryVariables = Exact<{
  queryString?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Array<IWorkStatus>>;
  types?: InputMaybe<Array<IWorkType>>;
  created?: InputMaybe<IDateFilterInput>;
  sort?: InputMaybe<Array<ISortOptionInput>>;
}>;


export type IWorkQueueQuery = { activeWorkTypes: Array<IWorkType>, workQueueCount: number, workQueue: Array<{ _id: string, type: IWorkType, scheduled?: any | null, status: IWorkStatus, started?: any | null, success?: boolean | null, finished?: any | null, created: any, deleted?: any | null, retries: number, input?: any | null, result?: any | null, original?: { _id: string, retries: number } | null }> };
