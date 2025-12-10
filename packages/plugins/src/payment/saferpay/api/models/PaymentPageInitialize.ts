import type { PaymentMethods } from './PaymentMethods.js';
import type { Request } from './Request.js';
import type { Response } from './Response.js';
import type { TransactionAmount } from './Transaction.js';

export interface PaymentPageInitializeInput extends Request {
  ConfigSet?: string;
  TerminalId: string;
  Payment: {
    Amount: TransactionAmount;
    OrderId?: string;
    PayerNote?: string;
    Description: string;
    MandateId?: string;
    Options?: {
      PreAuth?: boolean;
      AllowPartialAuthorization?: boolean;
    };
  };
  Recurring?: {
    initial: boolean;
  };
  Installment?: {
    initial: boolean;
  };
  PaymentMethods?: PaymentMethods[];
  PaymentMethodsOptions?: Map<string, Map<string, string>>;
  Authentication?: {
    Exemption?: string;
    ThreeDsChallenge?: string;
  };
  Wallets?: string[];
  Payer?: {
    IpAddress?: string;
    Ipv6Address?: string;
    LanguageCode?: string;
    BillingAddress?: Map<string, string>;
    DeliveryAddress?: Map<string, string>;
  };
  RegisterAlias?: {
    IdGenerator: 'MANUAL' | 'RANDOM' | 'RANDOM_UNIQUE';
    Id?: string;
    Lifetime?: number;
  };
  ReturnUrl: {
    Url: string;
  };
  Notification?: {
    SuccessNotifyUrl?: string;
    FailNotifyUrl?: string;
  };
}

export interface PaymentPageInitializeResponse extends Response {
  Token: string;
  Expiration: string; // ISO8601 UTC
  RedirectUrl: string;
}
