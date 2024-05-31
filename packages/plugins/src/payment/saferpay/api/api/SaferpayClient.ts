import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { TransactionCancelInput, TransactionCancelResponse } from '../models/TransactionCancel.js';
import { TransactionCaptureInput, TransactionCaptureResponse } from '../models/TransactionCapture.js';
import { PaymentPageAssertInput, PaymentPageAssertResponse } from '../models/PaymentPageAssert.js';
import {
  PaymentPageInitializeInput,
  PaymentPageInitializeResponse,
} from '../models/PaymentPageInitialize.js';
import { RequestHeader } from '../models/Request.js';
import { SaferpayConnection } from './SaferpayConnection.js';

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
    this.specVersion = specVersion || '1.38';
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
    orderPayment: OrderPayment,
    input: Omit<PaymentPageInitializeInput, 'RequestHeader'>,
  ): Promise<PaymentPageInitializeResponse> {
    return this.conn.post('/Payment/v1/PaymentPage/Initialize', {
      ...input,
      RequestHeader: this.buildRequestHeader(orderPayment._id, 0),
    }) as Promise<PaymentPageInitializeResponse>;
  }

  public async paymentPageAssert(
    orderPayment: OrderPayment,
    input: Omit<PaymentPageAssertInput, 'RequestHeader'>,
  ): Promise<PaymentPageAssertResponse> {
    return this.conn.post('/Payment/v1/PaymentPage/Assert', {
      ...input,
      RequestHeader: this.buildRequestHeader(orderPayment._id, 0),
    }) as Promise<PaymentPageAssertResponse>;
  }

  public async transactionCancel(
    orderPayment: OrderPayment,
    input: Omit<TransactionCancelInput, 'RequestHeader'>,
  ): Promise<TransactionCancelResponse> {
    return this.conn.post('/Payment/v1/Transaction/Cancel', {
      ...input,
      RequestHeader: this.buildRequestHeader(orderPayment._id, 0),
    }) as Promise<TransactionCancelResponse>;
  }

  public async transactionCapture(
    orderPayment: OrderPayment,
    input: Omit<TransactionCaptureInput, 'RequestHeader'>,
  ): Promise<TransactionCaptureResponse> {
    return this.conn.post('/Payment/v1/Transaction/Capture', {
      ...input,
      RequestHeader: this.buildRequestHeader(orderPayment._id, 0),
    }) as Promise<TransactionCaptureResponse>;
  }
}
