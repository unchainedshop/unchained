import type { Response } from './Response.js';
import type { Request } from './Request.js';

export interface TransactionCancelInput extends Request {
  TransactionReference: {
    TransactionId: string;
    OrderId?: string;
  };
}

export interface TransactionCancelResponse extends Response {
  TransactionId: string;
  OrderId?: string;
  Date: string;
}
