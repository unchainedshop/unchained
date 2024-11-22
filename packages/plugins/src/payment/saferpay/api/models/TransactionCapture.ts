import { Response } from './Response.js';
import { Request } from './Request.js';
import { TransactionAmount } from './Transaction.js';

export interface TransactionCaptureInput extends Request {
  TransactionReference: {
    TransactionId: string;
    OrderId?: string;
  };
  Amount?: TransactionAmount;
  Marketplace?: any; // TODO: Implement Marketplace type
}

export interface TransactionCaptureResponse extends Response {
  CaptureId: string;
  Status: 'PENDING' | 'CAPTURED';
  OrderId?: string;
  Date: string;
  Invoice?: any;
}
