import { Response } from './Response.js';
import { Request } from './Request.js';
import { TransactionAmount, TransactionStatus } from './Transaction.js';
import { PaymentMethods } from './PaymentMethods.js';

export interface PaymentPageAssertInput extends Request {
  Token: string;
}

export interface PaymentPageAssertResponse extends Response {
  Transaction: {
    Type: 'PAYMENT';
    Status: TransactionStatus;
    Id: string;
    CaptureId?: string;
    Date: string;
    Amount: TransactionAmount;
    OrderId?: string;
    AcquirerName?: string;
    AcquirerReference?: string;
    SixTransactionReference: string;
    ApprovalCode?: string;
    DirectDebit?: string;
    MandateId: string;
    CreditorId: string;
    Invoice: {
      Payee: Map<string, string>;
    };
    ReasonForTransfer?: string;
    DueDate?: string;
    IssuerReference?: Map<string, string>;
  };
  PaymentMeans: {
    Brand: {
      PaymentMethod?: PaymentMethods;
      Name: string;
    };
  };
  DisplayText: string;
  Wallet?: string;
  Card: {
    MaskedNumber: string;
    ExpYear: number;
    ExpMonth: number;
    HolderName?: string;
    HolderSegment?: string;
    CountryCode?: string;
    HashValue?: string;
  };
  BankAccount?: Map<string, string>;
  Twint?: Map<string, string>;
  Paypal?: Map<string, string>;
  Payer?: object;
  BillingAddress?: Map<string, string>;
  RegistrationResult?: {
    Success: boolean;
    Alias?: string;
    Id: string;
    Lifetime: number;
    Error?: {
      ErrorName?: string;
      ErrorMessage?: string;
    };
    AuthenticationResult?: {
      Result: 'OK' | 'NOT_SUPPORTED';
    };
    Message: string;
  };
  Liability?: object;
  Dcc?: object;
  MastercardIssuerInstallments?: object;
  FraudPrevention?: {
    Result?: 'APPROVED' | 'MANUAL_REVIEW';
  };
}
