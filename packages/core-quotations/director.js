import { log } from 'meteor/unchained:core-logger';

const QuotationError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
};

class QuotationAdapter {
  static key = ''

  static label = ''

  static version = ''

  static typeSupported(type) { // eslint-disable-line
    return false;
  }

  constructor(config, context) {
    this.config = config;
    this.context = context;
  }

  configurationError() { // eslint-disable-line
    return QuotationError.NOT_IMPLEMENTED;
  }

  isActive() { // eslint-disable-line
    return false;
  }

  async manualRequestVerificationNeeded(context) { // eslint-disable-line
    return true;
  }

  async manualProposalNeeded(context) { // eslint-disable-line
    return true;
  }

  async quote(context) { // eslint-disable-line
    return {};
  }

  async rejectWithReason() { // eslint-disable-line
    return true;
  }

  log(message, { level = 'verbose', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class QuotationDirector {
  constructor(quotation) {
    this.context = {
      quotation,
    };
  }

  findAppropriateAdapters(context) {
    return this.constructor.filteredAdapters(((AdapterClass) => {
      const activated = AdapterClass.isActivatedFor({
        ...this.context,
        ...context,
      });
      if (!activated) {
        log(`${this.constructor.name} -> ${AdapterClass.key} (${AdapterClass.version}) skipped`, {
          level: 'warn',
        });
      }
      return activated;
    }));
  }

  interface(context) {
    const Adapter = this
      .findAppropriateAdapters(context)
      .shift();
    if (!Adapter) {
      throw new Error('No suitable quotation plugin available for this context');
    }
    return new Adapter({
      ...this.context,
      ...context,
    });
  }

  async manualRequestVerificationNeeded(context) {
    try {
      const adapter = this.interface(context);
      const result = await adapter.manualRequestVerificationNeeded();
      return result;
    } catch (error) {
      console.error(error); // eslint-disable-line
      return null;
    }
  }

  async manualProposalNeeded(context) { // eslint-disable-line
    try {
      const adapter = this.interface(context);
      const result = await adapter.manualProposalNeeded();
      return result;
    } catch (error) {
      console.error(error); // eslint-disable-line
      return null;
    }
  }

  async quote(context) {
    try {
      const adapter = this.interface(context);
      const result = await adapter.quote();
      return result;
    } catch (error) {
      console.error(error); // eslint-disable-line
      return null;
    }
  }

  async rejectWithReason(context) {
    try {
      const adapter = this.interface(context);
      const result = await adapter.rejectWithReason();
      return result;
    } catch (error) {
      console.error(error); // eslint-disable-line
      return null;
    }
  }

  configurationError() {
    try {
      const adapter = this.interface();
      const error = adapter.configurationError();
      return error;
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return QuotationError.ADAPTER_NOT_FOUND;
    }
  }

  isActive(context) {
    try {
      const adapter = this.interface();
      return adapter.isActive(context);
    } catch (error) {
      console.warn(error); // eslint-disable-line
      return false;
    }
  }

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(QuotationDirector.adapters)
      .map(entry => entry[1])
      .filter(filter || (() => true));
  }

  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`) // eslint-disable-line
    QuotationDirector.adapters.set(adapter.key, adapter);
  }
}

export {
  QuotationDirector,
  QuotationAdapter,
  QuotationError,
};
