import type { Response } from './Response.ts';
import type { Request } from './Request.ts';

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
