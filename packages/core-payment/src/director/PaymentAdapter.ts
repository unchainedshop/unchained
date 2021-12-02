import { LogLevel } from 'meteor/unchained:logger';
import {
  PaymentConfiguration,
  PaymentContext,
  PaymentProviderType
} from '@unchainedshop/types/payments';
import { paymentLogger } from '../payment-logger';
import { PaymentError } from './PaymentError';

export class PaymentAdapter {
  static key = '';

  static label = '';

  static version = '';

  static initialConfiguration: Array<PaymentConfiguration> = [];

  static typeSupported(type: PaymentProviderType) {
    return false;
  }

  private config = {};
  private context = {};

  constructor(config: PaymentConfiguration, context: PaymentContext | {}) {
    this.config = config;
    this.context = context;
  }

  // eslint-disable-next-line
  configurationError(): PaymentError {
    return PaymentError.NOT_IMPLEMENTED;
  }

  // eslint-disable-next-line
  isActive(context: PaymentContext) {
    return false;
  }

  // eslint-disable-next-line
  isPayLaterAllowed(context: PaymentContext) {
    return false;
  }

  // eslint-disable-next-line
  async charge(chargeContext: any, userId?: string) {
    // if you return true, the status will be changed to PAID

    // if you return false, the order payment status stays the
    // same but the order status might change

    // if you throw an error, you cancel the checkout process
    return false;
  }

  // eslint-disable-next-line
  async register(registerContext: any) {
    return {
      token: '',
    };
  }

  // eslint-disable-next-line
  async sign(signContext: any) {
    return null;
  }

  // eslint-disable-next-line
  async validate(token: string) {
    return false;
  }

  // eslint-disable-next-line
  log(message: string, { level = LogLevel.Debug, ...meta } = {}) {
    paymentLogger.log(level, message, meta);
  }
}
