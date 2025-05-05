export interface Address {
  gender?: 'female' | 'male';
  title?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  street?: string;
  street2?: string;
  zipCode?: string;
  city?: string;
  countryCode?: string;
}

export type BillingAddress = Address & {
  countrySubdivision?: string;
  sortingCode?: string;
  phoneNumber?: string;
};

export type ShippingAddress = Address & {
  countrySubdivision?: string;
  sortingCode?: string;
  phone?: string;
  cellPhone?: string;
  carrier?: string;
  price?: number;
  priceGross?: number;
};

export type Customer = Address & {
  id?: string;
  phone?: string;
  cellPhone?: string;
  birthDate?: string; // YYYY-MM-DD
  language?: string;
  type?: 'P' | 'C'; // c = company, companyRegisterNumber + name required
  companyLegalForm?: string;
  companyRegisterNumber?: string;
  ipAddress?: string;
};

export interface Order {
  articles: Record<string, unknown>;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
}

export interface DT2015Configuration {
  brandColor: string;
  textColor: 'white' | 'black';
  logoType: 'circle' | 'rectangle' | 'none';
  logoBorderColor: string;
  brandButton: string;
  payButtonTextColor: string;
  logoSrc: string;
  initialView: 'list' | 'grid';
  brandTitle: string;
}

export type SupportedLanguage =
  | 'de'
  | 'en'
  | 'fr'
  | 'it'
  | 'es'
  | 'el'
  | 'no'
  | 'da'
  | 'pl'
  | 'pt'
  | 'ru'
  | 'ja';

export type PaymentMethod =
  | 'ACC'
  | 'ALP'
  | 'APL'
  | 'AMX'
  | 'AZP'
  | 'BON'
  | 'CFY'
  | 'CSY'
  | 'CUP'
  | 'DIN'
  | 'DII'
  | 'DIB'
  | 'DIS'
  | 'DNK'
  | 'ECA'
  | 'ELV'
  | 'EPS'
  | 'ESY'
  | 'INT'
  | 'JCB'
  | 'JEL'
  | 'KLN'
  | 'MAU'
  | 'MDP'
  | 'MFX'
  | 'MPX'
  | 'MYO'
  | 'PAP'
  | 'PAY'
  | 'PEF'
  | 'PFC'
  | 'PSC'
  | 'REK'
  | 'SAM'
  | 'SWB'
  | 'SCX'
  | 'SWP'
  | 'TWI'
  | 'UAP'
  | 'VIS'
  | 'WEC';

export type TransactionType = 'payment' | 'credit' | 'card_check';

export type TransactionStatusCode =
  | 'initialized'
  | 'challenge_required'
  | 'challenge_ongoing'
  | 'authenticated'
  | 'authorized'
  | 'settled'
  | 'canceled'
  | 'transmitted'
  | 'failed';

export interface ResponseError {
  error: {
    code:
      | 'UNKNOWN_ERROR'
      | 'UNAUTHORIZED'
      | 'INVALID_JSON_PAYLOAD'
      | 'UNRECOGNIZED_PROPERTY'
      | 'INVALID_PROPERTY'
      | 'CLIENT_ERROR'
      | 'SERVER_ERROR'
      | 'INVALID_TRANSACTION_STATUS'
      | 'TRANSACTION_NOT_FOUND'
      | 'EXPIRED_CARD'
      | 'INVALID_CARD'
      | 'BLOCKED_CARD'
      | 'UNSUPPORTED_CARD'
      | 'INVALID_ALIAS'
      | 'INVALID_CVV'
      | 'DUPLICATE_REFNO'
      | 'DECLINED'
      | 'SOFT_DECLINED'
      | 'INVALID_SIGN'
      | 'BLOCKED_BY_VELOCITY_CHECKER'
      | 'THIRD_PARTY_ERROR'
      | 'REFERRAL'
      | 'INVALID_SETUP';
    message: string;
  };
}

interface Split {
  subMerchantId: string;
  amount: number;
  commission: number;
}

export interface Marketplace {
  splits: Split[];
}

export interface InitRequestPayload {
  endpoint: string;
  secret: string;
  merchantId: string;
  currency: string;
  refno: string;
  refno2?: string; // optional
  amount?: number; // omit if only for registration
  customer?: Customer;
  billing?: BillingAddress;
  shipping?: ShippingAddress;
  order?: Order;
  card?: Record<string, unknown>;
  BON?: Record<string, unknown>;
  PAP?: Record<string, unknown>;
  PFC?: Record<string, unknown>;
  REK?: Record<string, unknown>;
  KLN?: Record<string, unknown>;
  TWI?: Record<string, unknown>;
  INT?: Record<string, unknown>;
  ESY?: Record<string, unknown>;
  SWP?: Record<string, unknown>;
  MFX?: Record<string, unknown>;
  MPX?: Record<string, unknown>;
  AZP?: Record<string, unknown>;
  EPS?: Record<string, unknown>;
  ALP?: Record<string, unknown>;
  WEC?: Record<string, unknown>;
  SWB?: Record<string, unknown>;
  MDF?: Record<string, unknown>;
  PSC?: Record<string, unknown>;
  airlineData?: Record<string, unknown>;
  language?: SupportedLanguage;
  paymentMethods?: PaymentMethod[];
  theme?: {
    configuration: DT2015Configuration;
  };
  redirect?: {
    successUrl?: string;
    cancelUrl?: string;
    errorUrl?: string;
    startTarget?: string;
    returnTarget?: string;
    method?: 'GET' | 'POST';
  };
  option?: {
    createAlias?: boolean;
    returnMaskedCardNumber?: boolean;
    returnCustomerCountry?: boolean;
    authenticationOnly?: boolean;
    rememberMe?: 'true' | 'checked';
    returnMobileToken?: boolean;
  };
}

export interface InitResponseSuccess {
  transactionId: string;
  mobileToken?: string;
  WEC?: Record<string, unknown>;
  ['3D']?: Record<string, unknown>;
  location?: string;
}

export interface StatusRequestPayload {
  transactionId: string;
}

export interface StatusResponseSuccess {
  transactionId: string;
  type: TransactionType;
  status: TransactionStatusCode;
  currency: string;
  refno: string;
  refno2: string;
  paymentMethod: PaymentMethod;
  detail: Record<string, unknown>;
  customer?: Customer;
  cdm?: Record<string, unknown>;
  language: SupportedLanguage;
  card?: Record<string, unknown>;
  TWI?: Record<string, unknown>;
  PAP?: Record<string, unknown>;
  REK?: Record<string, unknown>;
  ELV?: Record<string, unknown>;
  KLN?: Record<string, unknown>;
  INT?: Record<string, unknown>;
  SWP?: Record<string, unknown>;
  MFX?: Record<string, unknown>;
  MPX?: Record<string, unknown>;
  MDP?: Record<string, unknown>;
  ESY?: Record<string, unknown>;
  PFC?: Record<string, unknown>;
  WEC?: Record<string, unknown>;
  SCX?: Record<string, unknown>;
  history: Record<string, unknown>[];
  ep2?: Record<string, unknown>;
}

export interface SecureFieldsRequestPayload {
  currency: string;
  returnUrl?: string;
  amount?: number;
  ['3D']?: Record<string, unknown>;
}

export interface SecureFieldsResponseSuccess {
  transactionId: string;
}

export interface AuthorizeRequestPayload {
  amount: number;
  currency: string;
  refno: string;
  refno2?: string;
  autoSettle?: boolean;
  customer?: Customer;
  billing?: BillingAddress;
  shipping?: ShippingAddress;
  order?: Order;
  card?: Record<string, unknown>;
  BON?: Record<string, unknown>;
  PAP?: Record<string, unknown>;
  PFC?: Record<string, unknown>;
  REK?: Record<string, unknown>;
  KLN?: Record<string, unknown>;
  TWI?: Record<string, unknown>;
  INT?: Record<string, unknown>;
  ESY?: Record<string, unknown>;
  ACC?: Record<string, unknown>;
  PAY?: Record<string, unknown>;
  APL?: Record<string, unknown>;
  SWB?: Record<string, unknown>;
  airlineData?: Record<string, unknown>;
  marketplace?: Marketplace;
}

export interface AuthorizeResponseSuccess {
  transactionId: string;
  acquirerAuthorizationCode?: string;
}

export interface AuthorizeAuthenticatedRequestPayload {
  transactionId: string;
  refno: string;
  amount?: number;
  currency?: string;
  refno2?: string;
  autoSettle?: boolean;
  CDM?: Record<string, unknown>;
  ['3D']?: Record<string, unknown>;
}

export interface AuthorizeAuthenticatedResponseSuccess {
  acquirerAuthorizationCode: string;
}

export interface ValidateRequestPayload {
  currency: string;
  refno: string;
  refno2?: string;
  card?: Record<string, unknown>;
  PFC?: Record<string, unknown>;
  KLN?: Record<string, unknown>;
  PAP?: Record<string, unknown>;
  PAY?: Record<string, unknown>;
  APL?: Record<string, unknown>;
  ESY?: Record<string, unknown>;
}

export interface ValidateResponseSuccess {
  transactionId: string;
  acquirerAuthorizationCode?: string;
}

export interface SettleRequestPayload {
  transactionId: string;
  amount: number;
  currency: string;
  refno: string;
  refno2?: string;
  airlineData?: Record<string, unknown>;
  marketplace?: Marketplace;
  extensions?: Record<string, string>;
}

export interface CancelRequestPayload {
  transactionId: string;
  refno: string;
}

export type InitResponse = InitResponseSuccess | ResponseError;

export type SecureFieldsResponse = SecureFieldsResponseSuccess | ResponseError;

export type StatusResponse = StatusResponseSuccess | ResponseError;

export type AuthorizeResponse = AuthorizeResponseSuccess | ResponseError;

export type AuthorizeAuthenticatedResponse = AuthorizeAuthenticatedResponseSuccess | ResponseError;

export type ValidateResponse = ValidateResponseSuccess | ResponseError;

export type SettleResponse = true | ResponseError;

export type CancelResponse = true | ResponseError;

export type FetchDatatransFn = (path: string, body?: unknown) => Promise<Response>;
