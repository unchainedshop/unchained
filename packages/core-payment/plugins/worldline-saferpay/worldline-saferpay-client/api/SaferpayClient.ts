import { TransactionCancelInput, TransactionCancelResponse } from '../models/TransactionCancel';
import { PaymentPageAssertInput, PaymentPageAssertResponse } from '../models/PaymentPageAssert';
import {
  PaymentPageInitializeInput,
  PaymentPageInitializeResponse,
} from '../models/PaymentPageInitialize';
import { RequestHeader } from '../models/Request';
import { SaferpayConnection } from './SaferpayConnection';

export class SaferpayClient {
  private conn: SaferpayConnection;

  private customerId: string;

  private specVersion: string;

  public constructor(
    baseUrl: string,
    customerId: string,
    user: string,
    password: string,
    specVersion?: string,
  ) {
    this.customerId = customerId;
    this.specVersion = specVersion || '1.27';
    this.conn = new SaferpayConnection(baseUrl, user, password);
  }

  public buildRequestHeader(requestId: string, retryIndicator: number): RequestHeader {
    return {
      SpecVersion: this.specVersion,
      CustomerId: this.customerId,
      RequestId: requestId,
      RetryIndicator: retryIndicator,
    };
  }

  public async paymentPageInitialize(
    input: PaymentPageInitializeInput,
  ): Promise<PaymentPageInitializeResponse> {
    return this.conn.post(
      '/Payment/v1/PaymentPage/Initialize',
      input,
    ) as Promise<PaymentPageInitializeResponse>;
  }

  public async paymentPageAssert(input: PaymentPageAssertInput): Promise<PaymentPageAssertResponse> {
    return this.conn.post('/Payment/v1/PaymentPage/Assert', input) as Promise<PaymentPageAssertResponse>;
  }

  public async transactionCancel(input: TransactionCancelInput): Promise<TransactionCancelResponse> {
    return this.conn.post('/Payment/v1/Transaction/Cancel', input) as Promise<TransactionCancelResponse>;
  }
}
