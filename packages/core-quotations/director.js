import { log } from 'meteor/unchained:core-logger';

const QuotationError = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION: 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
};

class QuotationAdapter {
  static key = '';

  static label = '';

  static version = '';

  static isActivatedFor() {
    return true;
  }

  constructor(context) {
    this.context = context;
  }

  configurationError() { // eslint-disable-line
    return QuotationError.NOT_IMPLEMENTED;
  }

  async isManualRequestVerificationRequired() { // eslint-disable-line
    return true;
  }

  async isManualProposalRequired() { // eslint-disable-line
    return true;
  }

  async quote() { // eslint-disable-line
    return {};
  }

  async verify() { // eslint-disable-line
    return true;
  }

  async submit() { // eslint-disable-line
    return true;
  }

  async reject() { // eslint-disable-line
    return true;
  }

  async transformItemConfiguration({ quantity, configuration }) { // eslint-disable-line
    return { quantity, configuration };
  }

  log(message, { level = 'debug', ...options } = {}) { // eslint-disable-line
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
    return this.constructor.filteredAdapters((AdapterClass) => {
      const activated = AdapterClass.isActivatedFor({
        ...this.context,
        ...context,
      });
      if (!activated) {
        log(
          `${this.constructor.name} -> ${AdapterClass.key} (${AdapterClass.version}) skipped`,
          {
            level: 'warn',
          }
        );
      }
      return activated;
    });
  }

  interface(context) {
    const Adapter = this.findAppropriateAdapters(context).shift();
    if (!Adapter) {
      throw new Error(
        'No suitable quotation plugin available for this context'
      );
    }
    return new Adapter({
      ...this.context,
      ...context,
    });
  }

  async isManualRequestVerificationRequired(context) {
    try {
      const adapter = this.interface(context);
      const result = await adapter.isManualRequestVerificationRequired();
      return result;
    } catch (error) {
      console.error(error); // eslint-disable-line
      return null;
    }
  }

  async isManualProposalRequired(context) { // eslint-disable-line
    try {
      const adapter = this.interface(context);
      const result = await adapter.isManualProposalRequired();
      return result;
    } catch (error) {
      console.error(error); // eslint-disable-line
      return null;
    }
  }

  async transformItemConfiguration({ quantity, configuration }) {
    // eslint-disable-line
    try {
      const adapter = this.interface();
      const result = await adapter.transformItemConfiguration({
        quantity,
        configuration,
      });
      return result;
    } catch (error) {
      console.error(error); // eslint-disable-line
      return null;
    }
  }

  async quote(context) {
    const adapter = this.interface(context);
    const result = await adapter.quote();
    return result;
  }

  async verify(context) {
    const adapter = this.interface(context);
    const result = await adapter.verify();
    return result;
  }

  async submit(context) {
    const adapter = this.interface(context);
    const result = await adapter.submit();
    return result;
  }

  async reject(context) {
    const adapter = this.interface(context);
    const result = await adapter.reject();
    return result;
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

  static adapters = new Map();

  static filteredAdapters(filter) {
    return Array.from(QuotationDirector.adapters)
      .map((entry) => entry[1])
      .filter(filter || (() => true));
  }

  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`) // eslint-disable-line
    QuotationDirector.adapters.set(adapter.key, adapter);
  }
}

export { QuotationDirector, QuotationAdapter, QuotationError };
