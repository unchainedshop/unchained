import { Response } from './Response';
import { Request } from './Request';

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
