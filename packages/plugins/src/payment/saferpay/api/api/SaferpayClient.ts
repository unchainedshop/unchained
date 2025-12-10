import type { OrderPayment } from '@unchainedshop/core-orders';
import type { TransactionCancelInput, TransactionCancelResponse } from '../models/TransactionCancel.ts';
import type {
  TransactionCaptureInput,
  TransactionCaptureResponse,
} from '../models/TransactionCapture.ts';
import type { PaymentPageAssertInput, PaymentPageAssertResponse } from '../models/PaymentPageAssert.ts';
import {
  type PaymentPageInitializeInput,
  type PaymentPageInitializeResponse,
} from '../models/PaymentPageInitialize.ts';
import type { RequestHeader } from '../models/Request.ts';
import { SaferpayConnection } from './SaferpayConnection.ts';

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
