import { log, LogLevel } from 'meteor/unchained:logger';
import {
  WarehousingContext,
  WarehousingProviderType,
  WarehousingAdapter as IWarehousingAdapter,
  WarehousingProvider,
} from '@unchainedshop/types/warehousing';
import { WarehousingError } from './WarehousingError';

export class WarehousingAdapter implements IWarehousingAdapter {
  static key = '';

  static label = '';

  static version = '';

  static typeSupported(type) {
    // eslint-disable-line
    return false;
  }

  public config: WarehousingProvider['configuration'];
  public context: WarehousingContext;

  constructor(
    config: WarehousingProvider['configuration'],
    context: WarehousingContext
  ) {
    this.config = config;
    this.context = context;
  }

  configurationError() {
    // eslint-disable-line
    return WarehousingError.NOT_IMPLEMENTED;
  }

  isActive() {
    // eslint-disable-line
    return false;
  }

  async stock(referenceDate) {
    // eslint-disable-line
    return 0;
  }

  async productionTime(quantityToProduce) {
    // eslint-disable-line
    return 0;
  }

  async commissioningTime(quantity) {
    // eslint-disable-line
    return 0;
  }

  log(message, { level = LogLevel.Debug, ...options } = {}) {
    // eslint-disable-line
    return log(message, { level, ...options });
  }
}
