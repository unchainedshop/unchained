// PostFinance Checkout API Types

export enum TransactionState {
  CREATE = 'CREATE',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  FAILED = 'FAILED',
  AUTHORIZED = 'AUTHORIZED',
  VOIDED = 'VOIDED',
  COMPLETED = 'COMPLETED',
  FULFILL = 'FULFILL',
  DECLINE = 'DECLINE',
}

export enum TokenizationMode {
  FORCE_UPDATE = 'FORCE_UPDATE',
  ALLOW = 'ALLOW',
  ALLOW_ONE_CLICK_PAYMENT = 'ALLOW_ONE_CLICK_PAYMENT',
  DENY = 'DENY',
}

export enum TransactionCompletionBehavior {
  COMPLETE_IMMEDIATELY = 'COMPLETE_IMMEDIATELY',
  COMPLETE_DEFERRED = 'COMPLETE_DEFERRED',
  USE_CONFIGURATION = 'USE_CONFIGURATION',
}

export enum LineItemType {
  SHIPPING = 'SHIPPING',
  DISCOUNT = 'DISCOUNT',
  FEE = 'FEE',
  PRODUCT = 'PRODUCT',
  TIP = 'TIP',
}

export enum RefundType {
  MERCHANT_INITIATED_ONLINE = 'MERCHANT_INITIATED_ONLINE',
  MERCHANT_INITIATED_OFFLINE = 'MERCHANT_INITIATED_OFFLINE',
  CUSTOMER_INITIATED_AUTOMATIC = 'CUSTOMER_INITIATED_AUTOMATIC',
  CUSTOMER_INITIATED_MANUAL = 'CUSTOMER_INITIATED_MANUAL',
}

export enum CreationEntityState {
  CREATE = 'CREATE',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETING = 'DELETING',
  DELETED = 'DELETED',
}

export interface LineItem {
  name: string;
  type: LineItemType;
  quantity: number;
  uniqueId: string;
  amountIncludingTax: number;
}

export interface TransactionCreate {
  currency: string;
  customerId?: string;
  tokenizationMode?: TokenizationMode;
  completionBehavior?: TransactionCompletionBehavior;
  lineItems?: LineItem[];
  successUrl?: string;
  failedUrl?: string;
  metaData?: Record<string, any>;
}

export interface Transaction {
  id: number;
  state: TransactionState;
  currency: string;
  completedAmount?: number;
  authorizationAmount?: number;
  metaData?: Record<string, any>;
  token?: {
    id: number;
    [key: string]: any;
  };
}

export interface TransactionCompletion {
  id: number;
  state: string;
  transaction: number;
  linkedTransaction?: number;
}

export interface Token {
  id: number;
  state: CreationEntityState;
  name?: string;
  customerId?: string;
  enabledForOneClickPayment?: boolean;
}

export interface RefundCreate {
  transaction: number;
  externalId: string;
  amount: number;
  type: RefundType;
}

export interface Refund {
  id: number;
  state: string;
  amount: number;
  transaction: number;
}
