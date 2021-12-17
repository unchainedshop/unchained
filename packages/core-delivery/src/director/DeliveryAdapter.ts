import { Context } from '@unchainedshop/types/api';
import {
  DeliveryAdapter as IDeliveryAdapter,
  DeliveryConfiguration,
  DeliveryContext,
} from '@unchainedshop/types/delivery';
import { Work } from '@unchainedshop/types/worker';
import { log, LogLevel } from 'meteor/unchained:logger';
import { DeliveryError } from './DeliveryError';

type DeliveryAdapterContext = DeliveryContext & Context;

export class DeliveryAdapter implements IDeliveryAdapter {
  static key = '';

  static label = '';

  static version = '';

  static typeSupported(type) {
    // eslint-disable-line
    return false;
  }

  static initialConfiguration: DeliveryConfiguration = [];

  protected config;
  protected context: DeliveryAdapterContext;

  constructor(config, context) {
    this.config = config;
    this.context = context;
  }

  configurationError() {
    // eslint-disable-line
    return DeliveryError.NOT_IMPLEMENTED;
  }

  isActive() {
    // eslint-disable-line
    return false;
  }

  async estimatedDeliveryThroughput(warehousingThroughputTime) {
    // eslint-disable-line
    return 0;
  }

  async send(transactionContext: any): Promise<boolean | Work> {
    // eslint-disable-line
    // if you return true, the status will be changed to DELIVERED

    // if you return false, the order delivery status stays the
    // same but the order status might change

    // if you throw an error, you cancel the whole checkout process
    return false;
  }

  async pickUpLocationById(locationId: string) {
    // eslint-disable-line
    return null;
  }

  async pickUpLocations() {
    // eslint-disable-line
    return [];
  }

  isAutoReleaseAllowed() {
    // eslint-disable-line
    // if you return false here,
    // the order will need manual confirmation before
    // unchained will try to invoke send()
    return true;
  }

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    // eslint-disable-line
    return log(message, { level, ...options });
  }
}
